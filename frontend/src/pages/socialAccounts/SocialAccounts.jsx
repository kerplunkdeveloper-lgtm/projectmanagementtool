import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlus,
  FiSearch,
  FiEdit3,
  FiTrash2,
  FiCopy,
  FiCheck,
  FiEye,
  FiEyeOff,
  FiExternalLink,
  FiX,
  FiShield,
  FiLock,
  FiGlobe,
  FiPhone,
  FiMail,
  FiUser,
  FiBriefcase,
  FiDownload,
  FiLayers,
  FiGrid,
  FiList,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiKey,
} from "react-icons/fi";
import {
  FaInstagram,
  FaFacebookF,
  FaTiktok,
} from "react-icons/fa";
import {
  getSocialAccounts,
  createSocialAccount,
  updateSocialAccount,
  deleteSocialAccount,
} from "../../features/socialAccounts/socialAccountSlice";
import { getClients } from "../../features/clients/clientslice";
import { getUsers } from "../../features/users/userSlice";
import ClientBadge from "../../components/common/ClientBadge";
import toast from "react-hot-toast";

const renderUserAvatarSmall = (u, sizeClass = "w-7 h-7 text-[9px]") => {
  if (!u) return null;
  const avatarUrl =
    (typeof u.profile?.profileImage === "object"
      ? u.profile?.profileImage?.url
      : u.profile?.profileImage) ||
    (typeof u.profileImage === "object"
      ? u.profileImage?.url
      : u.profileImage) ||
    u.profilePic ||
    u.avatar ||
    u.profile?.profilePic ||
    u.profile?.avatar;

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={u.name || "User"}
        className={`${sizeClass} rounded-full object-cover border border-slate-200/80 dark:border-white/10 shadow-2xs shrink-0`}
      />
    );
  }

  const initials = (u.name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const AVATAR_COLORS = [
    "from-violet-500 to-indigo-600",
    "from-cyan-500 to-blue-600",
    "from-emerald-500 to-teal-600",
    "from-orange-500 to-amber-600",
    "from-pink-500 to-rose-600",
  ];
  const colorClass =
    AVATAR_COLORS[((u.name || "U").charCodeAt(0) || 0) % AVATAR_COLORS.length];

  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-black border border-white/10 shadow-2xs shrink-0`}
    >
      {initials}
    </div>
  );
};

// Helper to check if a platform object has any content
const hasPlatformData = (platform) => {
  if (!platform) return false;
  return Boolean(
    platform.username?.trim() ||
    platform.password?.trim() ||
    platform.email?.trim() ||
    platform.phoneNumber?.trim() ||
    platform.profileUrl?.trim() ||
    platform.pageUrl?.trim()
  );
};

// Compact, crisp copyable credential pill with high dark-mode contrast
const CredentialPill = ({
  label,
  value,
  isPassword = false,
  icon: Icon,
  externalLink,
}) => {
  const [copied, setCopied] = useState(false);
  const [showPass, setShowPass] = useState(false);

  if (!value) return null;

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`${label} copied!`, { duration: 1200, id: `copy-${label}-${value}` });
    setTimeout(() => setCopied(false), 1500);
  };

  const displayVal = isPassword && !showPass ? "••••••••" : value;

  return (
    <div className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100/90 dark:bg-[#141e33] border border-slate-200/80 dark:border-white/10 group hover:border-indigo-400/80 dark:hover:border-indigo-400/50 transition-all">
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        {Icon && <Icon className="w-3 h-3 text-slate-400 dark:text-slate-400 shrink-0" />}
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 leading-none mb-0.5">
            {label}
          </span>
          <div className="flex items-center gap-1 min-w-0">
            <span
              className={`text-[11px] font-semibold truncate ${
                isPassword && !showPass
                  ? "tracking-widest font-mono text-indigo-600 dark:text-emerald-400"
                  : "text-slate-900 dark:text-white select-all"
              }`}
              title={value}
            >
              {displayVal}
            </span>
            {externalLink && (
              <a
                href={externalLink}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 shrink-0 inline-flex items-center ml-0.5"
                title="Open link"
              >
                <FiExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700/70 text-slate-500 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white transition-colors"
            title={showPass ? "Hide password" : "Show password"}
          >
            {showPass ? <FiEyeOff className="w-3 h-3" /> : <FiEye className="w-3 h-3" />}
          </button>
        )}
        <button
          type="button"
          onClick={handleCopy}
          className={`p-1 rounded-md transition-colors ${
            copied
              ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400"
              : "hover:bg-slate-200 dark:hover:bg-slate-700/70 text-slate-500 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white"
          }`}
          title={`Copy ${label}`}
        >
          {copied ? <FiCheck className="w-3 h-3" /> : <FiCopy className="w-3 h-3" />}
        </button>
      </div>
    </div>
  );
};

// Compact table password cell with eye toggle & copy
const TableCredentialCell = ({ username, password, email, phone, link, icon: Icon, brandColor, brandName }) => {
  const [showPass, setShowPass] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  if (!username && !password && !email && !phone) {
    return <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">None</span>;
  }

  const handleCopy = (val, fieldName) => {
    if (!val) return;
    navigator.clipboard.writeText(val);
    setCopiedField(fieldName);
    toast.success(`${fieldName} copied!`, { duration: 1200, id: `tbl-copy-${fieldName}-${val}` });
    setTimeout(() => setCopiedField(null), 1500);
  };

  return (
    <div className="space-y-1.5 min-w-[170px] max-w-[240px]">
      {/* Username Row */}
      {username && (
        <div className="flex items-center justify-between gap-1 text-[11px] font-bold text-slate-900 dark:text-white">
          <div className="flex items-center gap-1.5 truncate">
            {Icon && <Icon className={`w-3.5 h-3.5 shrink-0 ${brandColor}`} />}
            <span className="truncate" title={username}>
              {username}
            </span>
            {link && (
              <a
                href={link}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 shrink-0"
                title={`Open ${brandName}`}
              >
                <FiExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
          <button
            onClick={() => handleCopy(username, "Username")}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-0.5 rounded"
            title="Copy Username"
          >
            {copiedField === "Username" ? <FiCheck className="w-3 h-3 text-emerald-500" /> : <FiCopy className="w-3 h-3" />}
          </button>
        </div>
      )}

      {/* Password Row */}
      {password && (
        <div className="flex items-center justify-between gap-1 text-[10px] px-2 py-1 rounded-md bg-slate-100 dark:bg-[#141e33] border border-slate-200/70 dark:border-white/10">
          <div className="flex items-center gap-1.5 font-mono truncate">
            <FiLock className="w-3 h-3 text-slate-400 shrink-0" />
            <span className={`truncate font-bold tracking-widest ${showPass ? "text-slate-900 dark:text-white" : "text-indigo-600 dark:text-emerald-400"}`}>
              {showPass ? password : "••••••••"}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setShowPass(!showPass)}
              className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              title={showPass ? "Hide" : "Show"}
            >
              {showPass ? <FiEyeOff className="w-3 h-3" /> : <FiEye className="w-3 h-3" />}
            </button>
            <button
              onClick={() => handleCopy(password, "Password")}
              className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              title="Copy Password"
            >
              {copiedField === "Password" ? <FiCheck className="w-3 h-3 text-emerald-500" /> : <FiCopy className="w-3 h-3" />}
            </button>
          </div>
        </div>
      )}

      {/* Phone / Email compact chips */}
      {(email || phone) && (
        <div className="flex items-center gap-1.5 text-[9.5px] text-slate-500 dark:text-slate-400 truncate">
          {email && (
            <span
              onClick={() => handleCopy(email, "Email")}
              className="truncate cursor-pointer hover:text-indigo-500 dark:hover:text-indigo-300 font-medium"
              title={`Click to copy: ${email}`}
            >
              📧 {email}
            </span>
          )}
          {email && phone && <span>•</span>}
          {phone && (
            <span
              onClick={() => handleCopy(phone, "Phone")}
              className="truncate cursor-pointer hover:text-indigo-500 dark:hover:text-indigo-300 font-medium"
              title={`Click to copy: ${phone}`}
            >
              📞 {phone}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

const initialFormData = {
  client: "",
  clientName: "",
  registeredEmail: "",
  registeredPhone: "",
  status: "Active",
  instagram: {
    username: "",
    password: "",
    email: "",
    phoneNumber: "",
    profileUrl: "",
    notes: "",
  },
  facebook: {
    username: "",
    password: "",
    email: "",
    phoneNumber: "",
    pageUrl: "",
    notes: "",
  },
  tiktok: {
    username: "",
    password: "",
    email: "",
    phoneNumber: "",
    profileUrl: "",
    notes: "",
  },
  otherPlatforms: [],
  spoc: "",
  designation: "",
  accountManager: "",
  twoFactorNotes: "",
  generalNotes: "",
};

const SocialAccounts = () => {
  const dispatch = useDispatch();
  const { socialAccounts, isLoading, isSubmitting } = useSelector(
    (state) => state.socialAccounts || { socialAccounts: [], isLoading: false, isSubmitting: false }
  );
  const { clients } = useSelector((state) => state.clients || { clients: [] });
  const { users } = useSelector((state) => state.users || { users: [] });

  const [searchTerm, setSearchTerm] = useState("");
  const [clientFilter, setClientFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [platformFilter, setPlatformFilter] = useState("All");
  const [viewMode, setViewMode] = useState("table");

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [activeTab, setActiveTab] = useState("instagram");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);

  useEffect(() => {
    dispatch(getSocialAccounts());
    dispatch(getClients());
    dispatch(getUsers());
  }, [dispatch]);

  // Helper to get assigned Social Media / Account Manager(s) for a client/account (Filtered by Social Media Manager department or explicitly assigned)
  const getAssignedManagers = (acc) => {
    let assigned = [];
    if (acc.accountManager) {
      assigned = [acc.accountManager];
    } else if (acc.client?.assignedTo && (Array.isArray(acc.client.assignedTo) ? acc.client.assignedTo.length > 0 : Boolean(acc.client.assignedTo))) {
      assigned = acc.client.assignedTo;
    } else {
      const foundClient = clients.find(
        (c) =>
          c._id === (acc.client?._id || acc.client) ||
          (c.companyName &&
            acc.clientName &&
            c.companyName.trim().toLowerCase() === acc.clientName.trim().toLowerCase())
      );
      if (foundClient?.assignedTo) {
        assigned = foundClient.assignedTo;
      }
    }

    if (!assigned || (Array.isArray(assigned) && assigned.length === 0)) return [];
    const assignedArr = Array.isArray(assigned) ? assigned : [assigned];

    // 1. Resolve full user object (from populate or Redux users state)
    const resolvedUsers = assignedArr
      .map((item) => {
        let userObj = item;
        const userId = item?._id || item;
        const found = users?.find((u) => (u._id || u.id) === userId);

        if (typeof item === "string" || !item?.name) {
          if (found) userObj = found;
          else userObj = { _id: userId, name: "Assigned Member" };
        } else if (found) {
          // Merge to ensure department & full profile are available
          userObj = { ...item, ...found, department: item.department || found.department };
        }
        return userObj;
      })
      .filter(Boolean);

    // 2. Filter for users whose department or role is Social Media / SMM / Account Manager, or if explicitly assigned
    const smmUsers = resolvedUsers.filter((u) => {
      const dept = (u.department || "").toLowerCase().trim();
      const role = (u.role || "").toLowerCase().trim();
      const desig = (u.designation || "").toLowerCase().trim();

      return (
        dept.includes("social media") ||
        dept.includes("smm") ||
        role.includes("social media") ||
        role === "socialmediamanager" ||
        desig.includes("social media") ||
        desig.includes("smm")
      );
    });

    return smmUsers.length > 0 ? smmUsers : resolvedUsers;
  };

  // Unique client options list
  const clientOptions = useMemo(() => {
    const names = new Set();
    (socialAccounts || []).forEach((acc) => {
      if (acc.clientName?.trim()) names.add(acc.clientName.trim());
    });
    (clients || []).forEach((c) => {
      if (c.companyName?.trim()) names.add(c.companyName.trim());
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [socialAccounts, clients]);

  // Filter accounts
  const filteredAccounts = useMemo(() => {
    return (socialAccounts || []).filter((acc) => {
      const matchClient =
        clientFilter === "All" ||
        acc.clientName?.toLowerCase() === clientFilter.toLowerCase() ||
        acc.client?._id === clientFilter ||
        acc.client?.companyName?.toLowerCase() === clientFilter.toLowerCase();

      const matchStatus = statusFilter === "All" || acc.status === statusFilter;
      const term = searchTerm.toLowerCase().trim();
      const managers = getAssignedManagers(acc);
      const matchManager = managers.some((m) => m.name?.toLowerCase().includes(term));

      const matchSearch =
        !term ||
        matchManager ||
        acc.clientName?.toLowerCase().includes(term) ||
        acc.registeredEmail?.toLowerCase().includes(term) ||
        acc.registeredPhone?.toLowerCase().includes(term) ||
        acc.instagram?.username?.toLowerCase().includes(term) ||
        acc.instagram?.email?.toLowerCase().includes(term) ||
        acc.instagram?.phoneNumber?.toLowerCase().includes(term) ||
        acc.facebook?.username?.toLowerCase().includes(term) ||
        acc.facebook?.email?.toLowerCase().includes(term) ||
        acc.facebook?.phoneNumber?.toLowerCase().includes(term) ||
        acc.tiktok?.username?.toLowerCase().includes(term) ||
        acc.tiktok?.email?.toLowerCase().includes(term) ||
        acc.tiktok?.phoneNumber?.toLowerCase().includes(term) ||
        acc.otherPlatforms?.some(
          (p) =>
            p.username?.toLowerCase().includes(term) ||
            p.platformName?.toLowerCase().includes(term)
        );

      let matchPlatform = true;
      if (platformFilter === "instagram") {
        matchPlatform = hasPlatformData(acc.instagram);
      } else if (platformFilter === "facebook") {
        matchPlatform = hasPlatformData(acc.facebook);
      } else if (platformFilter === "tiktok") {
        matchPlatform = hasPlatformData(acc.tiktok);
      } else if (platformFilter === "other") {
        matchPlatform = acc.otherPlatforms?.some((p) => hasPlatformData(p));
      }

      return matchClient && matchStatus && matchSearch && matchPlatform;
    });
  }, [socialAccounts, clientFilter, searchTerm, statusFilter, platformFilter, clients, users]);

  // Check if any accounts have other platforms configured
  const hasAnyOtherPlatforms = useMemo(() => {
    return (socialAccounts || []).some((acc) =>
      (acc.otherPlatforms || []).some(hasPlatformData)
    );
  }, [socialAccounts]);

  // Statistics
  const stats = useMemo(() => {
    const total = socialAccounts?.length || 0;
    const active = socialAccounts?.filter((a) => a.status === "Active").length || 0;
    const igCount =
      socialAccounts?.filter((a) => hasPlatformData(a.instagram)).length || 0;
    const fbCount =
      socialAccounts?.filter((a) => hasPlatformData(a.facebook)).length || 0;
    const ttCount =
      socialAccounts?.filter((a) => hasPlatformData(a.tiktok)).length || 0;

    return { total, active, igCount, fbCount, ttCount };
  }, [socialAccounts]);

  // Handlers for Add/Edit
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setActiveTab("instagram");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (acc) => {
    setEditingId(acc._id);
    let managerId = acc.accountManager?._id || acc.accountManager || "";
    if (!managerId && acc.client?.assignedTo && acc.client.assignedTo.length > 0) {
      managerId = acc.client.assignedTo[0]?._id || acc.client.assignedTo[0] || "";
    }

    setFormData({
      client: acc.client?._id || acc.client || "",
      clientName: acc.clientName || "",
      spoc: acc.spoc || acc.client?.spoc || "",
      designation: acc.designation || acc.client?.designation || "",
      accountManager: managerId,
      registeredEmail: acc.registeredEmail || acc.instagram?.email || acc.facebook?.email || acc.tiktok?.email || "",
      registeredPhone: acc.registeredPhone || acc.instagram?.phoneNumber || acc.facebook?.phoneNumber || acc.tiktok?.phoneNumber || acc.client?.phoneNumber || "",
      instagram: {
        username: acc.instagram?.username || "",
        password: acc.instagram?.password || "",
        email: acc.instagram?.email || "",
        phoneNumber: acc.instagram?.phoneNumber || "",
      },
      facebook: {
        username: acc.facebook?.username || "",
        password: acc.facebook?.password || "",
        email: acc.facebook?.email || "",
        phoneNumber: acc.facebook?.phoneNumber || "",
      },
      tiktok: {
        username: acc.tiktok?.username || "",
        password: acc.tiktok?.password || "",
        email: acc.tiktok?.email || "",
        phoneNumber: acc.tiktok?.phoneNumber || "",
      },
      otherPlatforms: (acc.otherPlatforms || []).map((op) => ({
        platformName: op.platformName || "YouTube",
        username: op.username || "",
        password: op.password || "",
        email: op.email || "",
        phoneNumber: op.phoneNumber || "",
        profileUrl: op.profileUrl || "",
        notes: op.notes || "",
      })),
      twoFactorNotes: acc.twoFactorNotes || "",
      generalNotes: acc.generalNotes || "",
      status: acc.status || "Active",
    });
    setActiveTab("instagram");
    setIsModalOpen(true);
  };

  const handleClientSelect = (clientId) => {
    const found = clients.find((c) => c._id === clientId);
    if (found) {
      // Find assigned Account Manager (from client's assignedTo in Clients.jsx)
      let managerId = "";
      if (found.assignedTo && found.assignedTo.length > 0) {
        const smm = found.assignedTo.find((u) => {
          const userObj = typeof u === "object" ? u : users?.find((usr) => (usr._id || usr.id) === u);
          const dept = (userObj?.department || "").toLowerCase();
          const role = (userObj?.role || "").toLowerCase();
          return dept.includes("social media") || dept.includes("smm") || role.includes("social media");
        });
        const chosen = smm || found.assignedTo[0];
        managerId = chosen?._id || chosen || "";
      }

      setFormData((prev) => ({
        ...prev,
        client: found._id,
        clientName: found.companyName || "",
        spoc: found.spoc || "",
        designation: found.designation || "",
        accountManager: managerId || prev.accountManager,
        registeredEmail: prev.registeredEmail || found.email || "",
        registeredPhone: found.phoneNumber || prev.registeredPhone || "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        client: "",
        clientName: "",
        spoc: "",
        designation: "",
        accountManager: "",
      }));
    }
  };

  const handleAddOtherPlatform = () => {
    setFormData((prev) => ({
      ...prev,
      otherPlatforms: [
        ...prev.otherPlatforms,
        {
          platformName: "YouTube",
          username: "",
          password: "",
          email: "",
          phoneNumber: "",
          profileUrl: "",
          notes: "",
        },
      ],
    }));
  };

  const handleRemoveOtherPlatform = (index) => {
    setFormData((prev) => ({
      ...prev,
      otherPlatforms: prev.otherPlatforms.filter((_, i) => i !== index),
    }));
  };

  const handleOtherPlatformChange = (index, field, val) => {
    setFormData((prev) => {
      const updated = [...prev.otherPlatforms];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, otherPlatforms: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.clientName.trim()) {
      toast.error("Please provide or select a Client Name");
      return;
    }

    if (editingId) {
      const res = await dispatch(
        updateSocialAccount({ id: editingId, data: formData })
      );
      if (!res.error) {
        setIsModalOpen(false);
      }
    } else {
      const res = await dispatch(createSocialAccount(formData));
      if (!res.error) {
        setIsModalOpen(false);
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (!accountToDelete) return;
    await dispatch(deleteSocialAccount(accountToDelete._id));
    setDeleteModalOpen(false);
    setAccountToDelete(null);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!filteredAccounts.length) {
      toast.error("No accounts to export");
      return;
    }

    const headers = [
      "Social Media Manager",
      "Client Name",
      "Status",
      "Registered Email / Gmail",
      "Registered Phone",
      "Instagram User",
      "Instagram Pass",
      "Facebook User",
      "Facebook Pass",
      "TikTok User",
      "TikTok Pass",
      "2FA Notes",
      "General Notes",
    ];

    const rows = filteredAccounts.map((acc) => {
      const managers = getAssignedManagers(acc);
      const managerNames = managers.map((m) => m.name).filter(Boolean).join("; ") || "Unassigned";

      return [
        `"${managerNames}"`,
        `"${acc.clientName || ""}"`,
        `"${acc.status || ""}"`,
        `"${acc.registeredEmail || acc.instagram?.email || acc.facebook?.email || acc.tiktok?.email || ""}"`,
        `"${acc.registeredPhone || acc.instagram?.phoneNumber || acc.facebook?.phoneNumber || acc.tiktok?.phoneNumber || acc.client?.phoneNumber || ""}"`,
        `"${acc.instagram?.username || ""}"`,
        `"${acc.instagram?.password || ""}"`,
        `"${acc.facebook?.username || ""}"`,
        `"${acc.facebook?.password || ""}"`,
        `"${acc.tiktok?.username || ""}"`,
        `"${acc.tiktok?.password || ""}"`,
        `"${(acc.twoFactorNotes || "").replace(/"/g, '""')}"`,
        `"${(acc.generalNotes || "").replace(/"/g, '""')}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `social_credentials_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Social accounts exported to CSV!");
  };

  return (
    <div className="p-2 space-y-4 max-w-[1600px] mx-auto transition-all text-slate-800 dark:text-slate-100">
      {/* ======================================================== */}
      {/* HEADER                                                   */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-md shadow-indigo-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-white dark:bg-[#0c1322] rounded-[10px] flex items-center justify-center">
              <FiKey className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">
              Social Media Accounts
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Manage client logins, Instagram, Facebook, TikTok credentials & backup codes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => dispatch(getSocialAccounts())}
            disabled={isLoading}
            className="p-2 rounded-xl bg-white dark:bg-[#0c1322] border border-slate-200/80 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-xs transition-all"
            title="Refresh"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#0c1322] border border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-[11px] font-bold shadow-xs transition-all"
          >
            <FiDownload className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl theme-bg-accent text-white dark:text-black text-[11px] font-bold shadow-md transition-all transform active:scale-95"
          >
            <FiPlus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Account</span>
          </button>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
        {/* Total Clients */}
        <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-50/90 via-indigo-50/30 to-white dark:from-indigo-950/40 dark:via-indigo-950/20 dark:to-[#0c1322] border border-indigo-100/90 dark:border-indigo-500/20 shadow-xs hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700/80 dark:text-indigo-300/80">
              Total Clients
            </span>
            <div className="w-6 h-6 rounded-lg bg-indigo-100/80 dark:bg-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-300 shadow-2xs">
              <FiLayers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-indigo-950 dark:text-white">
              {stats.total}
            </span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              {stats.active} active
            </span>
          </div>
        </div>

        {/* Instagram */}
        <div className="p-3 rounded-xl bg-gradient-to-br from-pink-50/90 via-rose-50/30 to-white dark:from-pink-950/40 dark:via-rose-950/20 dark:to-[#0c1322] border border-pink-100/90 dark:border-pink-500/20 shadow-xs hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-pink-700/80 dark:text-pink-300/80">
              Instagram
            </span>
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center text-white shadow-2xs">
              <FaInstagram className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-pink-950 dark:text-white">
              {stats.igCount}
            </span>
            <span className="text-[10px] font-medium text-pink-600/80 dark:text-pink-400/80">linked</span>
          </div>
        </div>

        {/* Facebook */}
        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50/90 via-sky-50/30 to-white dark:from-blue-950/40 dark:via-sky-950/20 dark:to-[#0c1322] border border-blue-100/90 dark:border-blue-500/20 shadow-xs hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700/80 dark:text-blue-300/80">
              Facebook
            </span>
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-2xs">
              <FaFacebookF className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-blue-950 dark:text-white">
              {stats.fbCount}
            </span>
            <span className="text-[10px] font-medium text-blue-600/80 dark:text-blue-400/80">linked</span>
          </div>
        </div>

        {/* TikTok */}
        <div className="p-3 rounded-xl bg-gradient-to-br from-slate-100/90 via-cyan-50/30 to-white dark:from-slate-900/80 dark:via-cyan-950/20 dark:to-[#0c1322] border border-slate-200/80 dark:border-cyan-500/20 shadow-xs hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-cyan-300/80">
              TikTok
            </span>
            <div className="w-6 h-6 rounded-lg bg-slate-900 dark:bg-slate-800 flex items-center justify-center text-cyan-400 shadow-2xs border border-slate-700">
              <FaTiktok className="w-3 h-3" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {stats.ttCount}
            </span>
            <span className="text-[10px] font-medium text-slate-500 dark:text-cyan-400/80">linked</span>
          </div>
        </div>

        {/* Vault Status */}
        <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50/90 via-teal-50/30 to-white dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-[#0c1322] border border-emerald-100/90 dark:border-emerald-500/20 shadow-xs hover:shadow-md transition-all duration-200 col-span-2 sm:col-span-4 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700/80 dark:text-emerald-300/80">
              Security
            </span>
            <div className="w-6 h-6 rounded-lg bg-emerald-100/80 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-300 shadow-2xs">
              <FiShield className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black text-emerald-950 dark:text-white">
              Active Vault
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SEARCH, FILTER & VIEW CONTROLS                          */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 ">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Account ..."
            className="w-full px-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-[#141e33] border border-slate-200/80 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <FiX className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filters & View toggle */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
          {/* Client Filter */}
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-50 dark:bg-[#141e33] border border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200 focus:outline-none max-w-[140px] truncate"
            title="Filter by Client"
          >
            <option value="All">All Clients</option>
            {clientOptions.map((cName, idx) => (
              <option key={`client-opt-${idx}-${cName}`} value={cName}>
                {cName}
              </option>
            ))}
          </select>

          {/* Platform Filter */}
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-50 dark:bg-[#141e33] border border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="All">All Platforms</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="tiktok">TikTok</option>
            <option value="other">Other Platforms</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-50 dark:bg-[#141e33] border border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-[#141e33] p-0.5 rounded-lg border border-slate-200/60 dark:border-white/10">
            <button
              onClick={() => setViewMode("cards")}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === "cards"
                  ? "bg-white dark:bg-[#1e2d4d] text-indigo-600 dark:text-indigo-300 shadow-xs"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              }`}
              title="Cards View"
            >
              <FiGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === "table"
                  ? "bg-white dark:bg-[#1e2d4d] text-indigo-600 dark:text-indigo-300 shadow-xs"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              }`}
              title="Table View"
            >
              <FiList className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ACCOUNTS LISTING (CARDS OR TABLE)                        */}
      {/* ======================================================== */}
      {isLoading && !socialAccounts?.length ? (
        <div className="p-12 flex flex-col items-center justify-center bg-white dark:bg-[#0c1322] rounded-2xl border border-slate-200/70 dark:border-white/[0.08]">
          <div className="w-8 h-8 border-3 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin mb-3" />
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Loading social accounts...
          </p>
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#0c1322] rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 flex items-center justify-center mx-auto mb-3">
            <FiKey className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
            No accounts found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
            {searchTerm || statusFilter !== "All" || platformFilter !== "All" || clientFilter !== "All"
              ? "Try adjusting your search query or filters."
              : "Add client social media credentials to get started."}
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl theme-bg-accent text-white dark:text-black text-xs font-bold shadow-md transition-all"
          >
            <FiPlus className="w-3.5 h-3.5" />
            <span>Add Account</span>
          </button>
        </div>
      ) : viewMode === "cards" ? (
        /* CARDS GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredAccounts.map((acc, idx) => {
            const hasIg = hasPlatformData(acc.instagram);
            const hasFb = hasPlatformData(acc.facebook);
            const hasTt = hasPlatformData(acc.tiktok);
            const validOtherPlatforms = (acc.otherPlatforms || []).filter(hasPlatformData);
            const hasAnyPlatform = hasIg || hasFb || hasTt || validOtherPlatforms.length > 0;

            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                key={acc._id || `acc-card-${idx}`}
                className="bg-white dark:bg-[#0c1322] rounded-2xl border border-slate-200/70 dark:border-white/[0.08] shadow-xs hover:shadow-lg hover:border-slate-300 dark:hover:border-white/20 transition-all duration-200 flex flex-col overflow-hidden"
              >
                {/* Card Top Header */}
                <div className="p-3.5 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-2 bg-slate-50/60 dark:bg-[#0e1628]/80">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs text-white shadow-xs shrink-0"
                      style={{
                        backgroundColor: acc.client?.color || "#6366f1",
                      }}
                    >
                      {(acc.clientName || "C").substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {acc.clientName}
                        </h3>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                            acc.status === "Active"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          {acc.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-400 truncate">
                        {acc.client?.industry && <span>{acc.client.industry}</span>}
                        {(() => {
                          const managers = getAssignedManagers(acc);
                          if (!managers || managers.length === 0) return null;
                          return (
                            <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium truncate">
                              • {managers.map((m) => m.name).join(", ")}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(acc)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-white/10 dark:hover:text-indigo-300 transition-colors"
                      title="Edit Credentials"
                    >
                      <FiEdit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setAccountToDelete(acc);
                        setDeleteModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors"
                      title="Delete Account"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-3.5 space-y-3 flex-1">
                  {/* Common Registered Email / Phone Pill Banner in Card */}
                  {(acc.registeredEmail || acc.registeredPhone || acc.instagram?.email || acc.instagram?.phoneNumber || acc.client?.phoneNumber) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-2 rounded-xl bg-slate-50/80 dark:bg-[#141e33] border border-slate-200/80 dark:border-white/10">
                      <CredentialPill
                        label="Registered Gmail / Email"
                        value={acc.registeredEmail || acc.instagram?.email || acc.facebook?.email || acc.tiktok?.email}
                        icon={FiMail}
                      />
                      <CredentialPill
                        label="Registered Phone"
                        value={acc.registeredPhone || acc.instagram?.phoneNumber || acc.facebook?.phoneNumber || acc.tiktok?.phoneNumber || acc.client?.phoneNumber}
                        icon={FiPhone}
                      />
                    </div>
                  )}

                  {!hasAnyPlatform && (
                    <div className="p-4 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-xl">
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                        No platform credentials entered for this client yet.
                      </p>
                    </div>
                  )}

                  {/* INSTAGRAM SECTION (Only if has data) */}
                  {hasIg && (
                    <div className="p-2.5 rounded-xl bg-pink-500/5 dark:bg-pink-950/20 border border-pink-500/20 dark:border-pink-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center text-white text-[10px] shadow-2xs">
                            <FaInstagram />
                          </div>
                          <span className="text-[11px] font-bold text-slate-900 dark:text-white">
                            Instagram
                          </span>
                        </div>
                        {acc.instagram?.username && (
                          <a
                            href={`https://instagram.com/${acc.instagram.username.replace("@", "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-bold text-pink-600 dark:text-pink-400 flex items-center gap-0.5 hover:underline"
                          >
                            <span>@{acc.instagram.username}</span>
                            <FiExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        <CredentialPill
                          label="Username"
                          value={acc.instagram?.username}
                          icon={FiUser}
                        />
                        <CredentialPill
                          label="Password"
                          value={acc.instagram?.password}
                          isPassword={true}
                          icon={FiLock}
                        />
                      </div>
                    </div>
                  )}

                  {/* FACEBOOK SECTION (Only if has data) */}
                  {hasFb && (
                    <div className="p-2.5 rounded-xl bg-blue-500/5 dark:bg-blue-950/20 border border-blue-500/20 dark:border-blue-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center text-white text-[10px] shadow-2xs">
                            <FaFacebookF />
                          </div>
                          <span className="text-[11px] font-bold text-slate-900 dark:text-white">
                            Facebook
                          </span>
                        </div>
                        {acc.facebook?.username && (
                          <a
                            href={
                              acc.facebook?.pageUrl ||
                              `https://facebook.com/${acc.facebook.username}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 hover:underline"
                          >
                            <span>{acc.facebook.username}</span>
                            <FiExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        <CredentialPill
                          label="Username / Page"
                          value={acc.facebook?.username}
                          icon={FiUser}
                        />
                        <CredentialPill
                          label="Password"
                          value={acc.facebook?.password}
                          isPassword={true}
                          icon={FiLock}
                        />
                      </div>
                    </div>
                  )}

                  {/* TIKTOK SECTION (Only if has data) */}
                  {hasTt && (
                    <div className="p-2.5 rounded-xl bg-cyan-500/5 dark:bg-cyan-950/20 border border-cyan-500/20 dark:border-cyan-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-md bg-slate-900 dark:bg-slate-800 flex items-center justify-center text-cyan-400 text-[10px] shadow-2xs border border-slate-700">
                            <FaTiktok />
                          </div>
                          <span className="text-[11px] font-bold text-slate-900 dark:text-white">
                            TikTok
                          </span>
                        </div>
                        {acc.tiktok?.username && (
                          <a
                            href={`https://tiktok.com/@${acc.tiktok.username.replace("@", "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-0.5 hover:underline"
                          >
                            <span>@{acc.tiktok.username}</span>
                            <FiExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        <CredentialPill
                          label="Username"
                          value={acc.tiktok?.username}
                          icon={FiUser}
                        />
                        <CredentialPill
                          label="Password"
                          value={acc.tiktok?.password}
                          isPassword={true}
                          icon={FiLock}
                        />
                      </div>
                    </div>
                  )}

                  {/* OTHER PLATFORMS (Only if has valid data) */}
                  {validOtherPlatforms.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Other Platforms ({validOtherPlatforms.length})
                      </span>
                      <div className="space-y-1.5">
                        {validOtherPlatforms.map((op, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-xl bg-slate-50/80 dark:bg-[#141e33] border border-slate-200/60 dark:border-white/10"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                                {op.platformName}
                              </span>
                              {op.username && (
                                <span className="text-[10px] text-slate-500 dark:text-slate-300 font-medium truncate">
                                  {op.username}
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                              <CredentialPill
                                label="Username"
                                value={op.username}
                                icon={FiUser}
                              />
                              <CredentialPill
                                label="Password"
                                value={op.password}
                                isPassword={true}
                                icon={FiLock}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2FA OR GENERAL NOTES (Only if entered) */}
                  {(acc.twoFactorNotes || acc.generalNotes) && (
                    <div className="p-2 rounded-xl bg-amber-500/5 border border-amber-500/20 text-[10px] text-slate-700 dark:text-slate-200 space-y-1">
                      {acc.twoFactorNotes && (
                        <p>
                          <strong className="text-amber-600 dark:text-amber-400 font-bold">
                            2FA / Backup:
                          </strong>{" "}
                          {acc.twoFactorNotes}
                        </p>
                      )}
                      {acc.generalNotes && (
                        <p>
                          <strong className="text-slate-800 dark:text-white font-bold">
                            Note:
                          </strong>{" "}
                          {acc.generalNotes}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="px-3.5 py-2 bg-slate-50/50 dark:bg-[#0e1628]/60 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-[10px] text-slate-400">
                  <span>
                    Updated{" "}
                    {acc.updatedAt
                      ? new Date(acc.updatedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      : "Recently"}
                  </span>
                  {acc.createdBy?.name && <span>By {acc.createdBy.name}</span>}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW WITH PROPER DARK THEME HEADERS & REVEAL */
        <div className="bg-white dark:bg-[#0c1322] rounded-2xl border border-slate-200/70 dark:border-white/[0.08] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:!bg-[#111c33] border-b border-slate-200/80 dark:border-white/10 text-slate-700 dark:!text-slate-200 font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 text-slate-700 dark:!text-slate-200 font-extrabold whitespace-nowrap">Social Media Manager</th>
                  <th className="py-3 px-4 text-slate-700 dark:!text-slate-200 font-extrabold whitespace-nowrap">Client & Contact</th>
                  <th className="py-3 px-4 text-slate-700 dark:!text-slate-200 font-extrabold">Instagram</th>
                  <th className="py-3 px-4 text-slate-700 dark:!text-slate-200 font-extrabold">Facebook</th>
                  {hasAnyOtherPlatforms && (
                    <th className="py-3 px-4 text-slate-700 dark:!text-slate-200 font-extrabold">Other Platforms</th>
                  )}
                  <th className="py-3 px-4 text-slate-700 dark:!text-slate-200 font-extrabold">Status</th>
                  <th className="py-3 px-4 text-slate-700 dark:!text-slate-200 font-extrabold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {filteredAccounts.map((acc, idx) => {
                  const validOther = (acc.otherPlatforms || []).filter(hasPlatformData);
                  const displayEmail = acc.registeredEmail || acc.instagram?.email || acc.facebook?.email || acc.tiktok?.email;
                  const displayPhone = acc.registeredPhone || acc.instagram?.phoneNumber || acc.facebook?.phoneNumber || acc.tiktok?.phoneNumber || acc.client?.phoneNumber;
                  const managers = getAssignedManagers(acc);
                  const clientObj = acc.client?._id
                    ? acc.client
                    : (clients || []).find((c) =>
                        c._id === (acc.client?._id || acc.client) ||
                        (c.companyName && acc.clientName && c.companyName.trim().toLowerCase() === acc.clientName.trim().toLowerCase())
                      ) || { companyName: acc.clientName, color: "#6366f1" };

                  return (
                    <tr
                      key={acc._id || `acc-row-${idx}`}
                      className="hover:bg-slate-50/70 dark:hover:bg-[#131e36]/60 transition-colors"
                    >
                      {/* Social Media Manager (First Field with Profile Image) */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        {managers && managers.length > 0 ? (
                          <div className="space-y-1.5">
                            {managers.map((m, mIdx) => (
                              <div key={m._id || mIdx} className="flex items-center gap-2.5">
                                {renderUserAvatarSmall(m, "w-7 h-7 text-[9px]")}
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[150px]" title={m.name}>
                                    {m.name || "Manager"}
                                  </span>
                                  <span className="text-[9.5px] font-medium text-indigo-600 dark:text-indigo-400 capitalize truncate max-w-[150px]">
                                    {m.department || (m.role === "socialmediamanager" ? "Social Media Manager" : "Social Media")}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 italic">
                            <div className="w-6 h-6 rounded-full border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-[10px]">
                              <FiUser className="w-3 h-3 text-slate-400" />
                            </div>
                            <span>Unassigned</span>
                          </div>
                        )}
                      </td>

                      {/* Client Name & Contact */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <ClientBadge client={clientObj} size="sm" />
                          {acc.client?.industry && (
                            <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-medium">
                              {acc.client.industry}
                            </span>
                          )}
                        </div>
                        {(acc.spoc || acc.client?.spoc || clientObj?.spoc) && (
                          <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-700 dark:text-slate-300 mt-1">
                            <FiUser className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
                            <span>{acc.spoc || acc.client?.spoc || clientObj?.spoc}</span>
                            {(acc.designation || acc.client?.designation || clientObj?.designation) && (
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-normal">
                                • {acc.designation || acc.client?.designation || clientObj?.designation}
                              </span>
                            )}
                          </div>
                        )}
                        {(displayEmail || displayPhone) && (
                          <div className="mt-1 space-y-0.5 text-[9.5px]">
                            {displayEmail && (
                              <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium truncate" title={displayEmail}>
                                <FiMail className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
                                <span className="truncate max-w-[170px]">{displayEmail}</span>
                              </div>
                            )}
                            {displayPhone && (
                              <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
                                <FiPhone className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                                <span>{displayPhone}</span>
                              </div>
                            )}
                          </div>
                        )}
                        {(acc.twoFactorNotes || acc.generalNotes) && (
                          <div className="mt-1 inline-flex items-center gap-1 text-[9px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                            <FiShield className="w-2.5 h-2.5" />
                            <span>Has 2FA notes</span>
                          </div>
                        )}
                      </td>

                      {/* Instagram Cell */}
                      <td className="py-3.5 px-4 align-top">
                        <TableCredentialCell
                          username={acc.instagram?.username}
                          password={acc.instagram?.password}
                          link={
                            acc.instagram?.username
                              ? `https://instagram.com/${acc.instagram.username.replace("@", "")}`
                              : null
                          }
                          icon={FaInstagram}
                          brandColor="text-pink-500"
                          brandName="Instagram"
                        />
                      </td>

                      {/* Facebook Cell */}
                      <td className="py-3.5 px-4 align-top">
                        <TableCredentialCell
                          username={acc.facebook?.username}
                          password={acc.facebook?.password}
                          link={
                            acc.facebook?.pageUrl ||
                            (acc.facebook?.username
                              ? `https://facebook.com/${acc.facebook.username}`
                              : null)
                          }
                          icon={FaFacebookF}
                          brandColor="text-blue-600 dark:text-blue-400"
                          brandName="Facebook"
                        />
                      </td>

                      {/* Other Platforms (if present) */}
                      {hasAnyOtherPlatforms && (
                        <td className="py-3.5 px-4 align-top">
                          {validOther.length > 0 ? (
                            <div className="space-y-1.5">
                              {validOther.map((op, oIdx) => (
                                <div key={oIdx} className="text-[10px]">
                                  <span className="font-bold text-purple-600 dark:text-purple-400">
                                    {op.platformName}:
                                  </span>{" "}
                                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                                    {op.username || "Set"}
                                  </span>
                                  {op.password && (
                                    <span className="ml-1 text-[9px] font-mono text-slate-400">
                                      (Pass: {op.password})
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                              None
                            </span>
                          )}
                        </td>
                      )}

                      {/* Status */}
                      <td className="py-3.5 px-4 align-top">
                        <span
                          className={`inline-flex text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            acc.status === "Active"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          {acc.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(acc)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
                            title="Edit"
                          >
                            <FiEdit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setAccountToDelete(acc);
                              setDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors"
                            title="Delete"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ADD / EDIT MODAL                                         */}
      {/* ======================================================== */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#0c1322] rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden my-6 z-10 flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between bg-slate-50/70 dark:bg-[#0e1628]/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <FiShield className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      {editingId ? "Edit Social Account" : "Add Social Account"}
                    </h2>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Configure client login credentials & backup access
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                {/* Client Details & Common Contact Section */}
                <div className="p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-[#141e33] border border-slate-200/80 dark:border-white/10 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                        Select Client
                      </label>
                      <select
                        value={formData.client || ""}
                        onChange={(e) => handleClientSelect(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="">-- Existing Client --</option>
                        {clients?.map((c, idx) => (
                          <option key={c._id || `client-${idx}`} value={c._id}>
                            {c.companyName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                        Client Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.clientName}
                        onChange={(e) =>
                          setFormData({ ...formData, clientName: e.target.value })
                        }

                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  {/* Client SPOC Details (Auto-fetched from Client) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 border-t border-slate-200/70 dark:border-white/[0.06]">
                    <div>
                      <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-1">
                        <FiUser className="w-3 h-3 text-indigo-500" />
                        <span>Client SPOC Name (Contact Person)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.spoc}
                        onChange={(e) =>
                          setFormData({ ...formData, spoc: e.target.value })
                        }

                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-1">
                        <FiBriefcase className="w-3 h-3 text-purple-500" />
                        <span>SPOC Designation</span>
                      </label>
                      <input
                        type="text"
                        value={formData.designation}
                        onChange={(e) =>
                          setFormData({ ...formData, designation: e.target.value })
                        }

                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>
                  </div>

                  {/* Common Registered Email & Phone Number */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 border-t border-slate-200/70 dark:border-white/[0.06]">
                    <div>
                      <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-1">
                        <FiMail className="w-3 h-3 text-indigo-500" />
                        <span>Registered Gmail / Email ID (Common)</span>
                      </label>
                      <input
                        type="email"
                        value={formData.registeredEmail}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            registeredEmail: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-1">
                        <FiPhone className="w-3 h-3 text-emerald-500" />
                        <span>Registered Phone Number (Common)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.registeredPhone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            registeredPhone: e.target.value,
                          })
                        }
                      
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div>
                  <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-white/10 overflow-x-auto pb-0.5">
                    <button
                      type="button"
                      onClick={() => setActiveTab("instagram")}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-bold transition-all border-b-2 ${
                        activeTab === "instagram"
                          ? "border-pink-500 text-pink-600 dark:text-pink-400 bg-pink-50/50 dark:bg-pink-950/30"
                          : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      }`}
                    >
                      <FaInstagram className="w-3 h-3" />
                      <span>Instagram</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("facebook")}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-bold transition-all border-b-2 ${
                        activeTab === "facebook"
                          ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30"
                          : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      }`}
                    >
                      <FaFacebookF className="w-3 h-3" />
                      <span>Facebook</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("tiktok")}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-bold transition-all border-b-2 ${
                        activeTab === "tiktok"
                          ? "border-cyan-500 text-slate-900 dark:text-cyan-400 bg-slate-100/60 dark:bg-cyan-950/30"
                          : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      }`}
                    >
                      <FaTiktok className="w-3 h-3" />
                      <span>TikTok</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("other")}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-bold transition-all border-b-2 ${
                        activeTab === "other"
                          ? "border-purple-600 text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-950/30"
                          : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      }`}
                    >
                      <FiGlobe className="w-3 h-3" />
                      <span>Other Platforms ({formData.otherPlatforms.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("security")}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-bold transition-all border-b-2 ${
                        activeTab === "security"
                          ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/30"
                          : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      }`}
                    >
                      <FiShield className="w-3 h-3" />
                      <span>2FA & Notes</span>
                    </button>
                  </div>
                </div>

                {/* TAB: INSTAGRAM */}
                {activeTab === "instagram" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                          Instagram Username
                        </label>
                        <input
                          type="text"
                          value={formData.instagram.username}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              instagram: {
                                ...formData.instagram,
                                username: e.target.value,
                              },
                            })
                          }
                          placeholder="e.g. acme_brand"
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-[#141e33] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                          Instagram Password
                        </label>
                        <input
                          type="text"
                          value={formData.instagram.password}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              instagram: {
                                ...formData.instagram,
                                password: e.target.value,
                              },
                            })
                          }
                          placeholder="Password"
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-[#141e33] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500/20 font-mono"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB: FACEBOOK */}
                {activeTab === "facebook" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                          Facebook Username / Page Name
                        </label>
                        <input
                          type="text"
                          value={formData.facebook.username}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              facebook: {
                                ...formData.facebook,
                                username: e.target.value,
                              },
                            })
                          }
                          placeholder="e.g. AcmePage"
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-[#141e33] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                          Facebook Password
                        </label>
                        <input
                          type="text"
                          value={formData.facebook.password}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              facebook: {
                                ...formData.facebook,
                                password: e.target.value,
                              },
                            })
                          }
                          placeholder="Password"
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-[#141e33] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB: TIKTOK */}
                {activeTab === "tiktok" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                          TikTok Username
                        </label>
                        <input
                          type="text"
                          value={formData.tiktok.username}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              tiktok: {
                                ...formData.tiktok,
                                username: e.target.value,
                              },
                            })
                          }
                          placeholder="e.g. acme_tiktok"
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-[#141e33] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                          TikTok Password
                        </label>
                        <input
                          type="text"
                          value={formData.tiktok.password}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              tiktok: {
                                ...formData.tiktok,
                                password: e.target.value,
                              },
                            })
                          }
                          placeholder="Password"
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-[#141e33] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB: OTHER PLATFORMS */}
                {activeTab === "other" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        Add YouTube, LinkedIn, Twitter/X, Pinterest, etc.
                      </span>
                      <button
                        type="button"
                        onClick={handleAddOtherPlatform}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 hover:bg-purple-100 transition-colors"
                      >
                        <FiPlus className="w-3 h-3" />
                        <span>Add Platform</span>
                      </button>
                    </div>

                    {formData.otherPlatforms.length === 0 ? (
                      <div className="p-6 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-xl">
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          No extra platforms added. Click &quot;Add Platform&quot; above.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {formData.otherPlatforms.map((op, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-slate-50 dark:bg-[#141e33] border border-slate-200 dark:border-white/10 space-y-2.5 relative"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <select
                                value={op.platformName}
                                onChange={(e) =>
                                  handleOtherPlatformChange(
                                    idx,
                                    "platformName",
                                    e.target.value
                                  )
                                }
                                className="w-40 px-2 py-1 text-xs font-bold rounded-md bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white"
                              >
                                <option value="YouTube">YouTube</option>
                                <option value="LinkedIn">LinkedIn</option>
                                <option value="Twitter / X">Twitter / X</option>
                                <option value="Pinterest">Pinterest</option>
                                <option value="Threads">Threads</option>
                                <option value="Snapchat">Snapchat</option>
                                <option value="Other">Other</option>
                              </select>

                              <button
                                type="button"
                                onClick={() => handleRemoveOtherPlatform(idx)}
                                className="text-rose-500 hover:text-rose-600 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/50"
                                title="Remove"
                              >
                                <FiTrash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={op.username}
                                onChange={(e) =>
                                  handleOtherPlatformChange(
                                    idx,
                                    "username",
                                    e.target.value
                                  )
                                }
                                placeholder="Username"
                                className="px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white"
                              />
                              <input
                                type="text"
                                value={op.password}
                                onChange={(e) =>
                                  handleOtherPlatformChange(
                                    idx,
                                    "password",
                                    e.target.value
                                  )
                                }
                                placeholder="Password"
                                className="px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white font-mono"
                              />
                              <input
                                type="email"
                                value={op.email}
                                onChange={(e) =>
                                  handleOtherPlatformChange(
                                    idx,
                                    "email",
                                    e.target.value
                                  )
                                }
                                placeholder="Email"
                                className="px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white"
                              />
                              <input
                                type="text"
                                value={op.phoneNumber}
                                onChange={(e) =>
                                  handleOtherPlatformChange(
                                    idx,
                                    "phoneNumber",
                                    e.target.value
                                  )
                                }
                                placeholder="Phone"
                                className="px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* TAB: 2FA & SECURITY */}
                {activeTab === "security" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        Two-Factor Authentication (2FA) & Backup Codes
                      </label>
                      <textarea
                        rows={3}
                        value={formData.twoFactorNotes}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            twoFactorNotes: e.target.value,
                          })
                        }
                        placeholder="e.g. 2FA sent to client mobile +91 98xxx. Backup codes: 123456, 789012..."
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-[#141e33] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        General Notes
                      </label>
                      <textarea
                        rows={2}
                        value={formData.generalNotes}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            generalNotes: e.target.value,
                          })
                        }
                        placeholder="e.g. Client requested posting between 6PM - 8PM only."
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-[#141e33] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Modal Footer Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl theme-bg-accent text-white dark:text-black text-xs font-bold shadow-sm disabled:opacity-50 transition-all"
                  >
                    {isSubmitting ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <FiCheckCircle className="w-3.5 h-3.5" />
                    )}
                    <span>{editingId ? "Update Account" : "Save Account"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* DELETE CONFIRMATION MODAL                                */}
      {/* ======================================================== */}
      <AnimatePresence>
        {deleteModalOpen && accountToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteModalOpen(false)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#0c1322] rounded-2xl border border-slate-200 dark:border-white/10 p-5 shadow-2xl z-10 text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
                <FiAlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                Delete Account Details?
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">
                Are you sure you want to delete credentials for{" "}
                <strong className="text-slate-800 dark:text-white font-semibold">
                  {accountToDelete.clientName}
                </strong>
                ?
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all"
                >
                  {isSubmitting ? "Deleting..." : "Yes, Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SocialAccounts;
