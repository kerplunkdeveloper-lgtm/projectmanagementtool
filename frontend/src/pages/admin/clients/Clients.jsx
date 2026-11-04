import React, { useEffect, useMemo, useState, useCallback } from "react";

import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiX,
  FiUsers,
  FiPhone,
  FiMail,
  FiBriefcase,
  FiDollarSign,
  FiPercent,
  FiGlobe,
  FiLayers,
  FiUser,
  FiAlertTriangle,
  FiBookOpen,
  FiSearch,
  FiVideo,
  FiPlusCircle,
  FiHelpCircle,
  FiCalendar,
  FiCheck,
  FiEye,
  FiArrowLeft,
  FiMoreHorizontal,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiCheckCircle,
  FiCamera,
  FiTool,
  FiMinus,
  FiInfo,
  FiEdit2,
  FiMessageSquare,
  FiPhoneCall,
  FiLock,
} from "react-icons/fi";
import { FaRegBuilding } from "react-icons/fa";
import {
  getClientIconComponent,
  CLIENT_COLORS,
  CLIENT_ICONS,
} from "../../../utils/clientHelpers";

import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
} from "../../../features/clients/clientslice";

import { getUsers } from "../../../features/users/userSlice";
import { getProjects } from "../../../features/projects/projectSlice";
import { getTasks } from "../../../features/tasks/taskSlice";
import { useTheme } from "../../../context/ThemeContext";
import toast from "react-hot-toast";

const renderUserAvatarSmall = (u, sizeClass = "w-6 h-6 text-[8px]") => {
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

const getUserColor = (userId) => {
  if (!userId)
    return {
      bg: "bg-slate-50/80 dark:bg-slate-900/10",
      text: "text-slate-400 dark:text-slate-500",
      border: "border-slate-200 dark:border-slate-800",
    };
  let hash = 0;
  const str = String(userId);
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    {
      bg: "bg-indigo-50/80 dark:bg-indigo-950/30",
      text: "text-indigo-600 dark:text-indigo-300",
      border: "border-indigo-100/80 dark:border-indigo-900/40",
    },
    {
      bg: "bg-fuchsia-50/80 dark:bg-fuchsia-950/30",
      text: "text-fuchsia-600 dark:text-fuchsia-300",
      border: "border-fuchsia-100/80 dark:border-fuchsia-900/40",
    },
    {
      bg: "bg-emerald-50/80 dark:bg-emerald-950/30",
      text: "text-emerald-600 dark:text-emerald-300",
      border: "border-emerald-100/80 dark:border-emerald-900/40",
    },
    {
      bg: "bg-rose-50/80 dark:bg-rose-950/30",
      text: "text-rose-600 dark:text-rose-300",
      border: "border-rose-100/80 dark:border-rose-900/40",
    },
    {
      bg: "bg-cyan-50/80 dark:bg-cyan-950/30",
      text: "text-cyan-600 dark:text-cyan-300",
      border: "border-cyan-100/80 dark:border-cyan-900/40",
    },
    {
      bg: "bg-amber-50/80 dark:bg-amber-950/30",
      text: "text-amber-600 dark:text-amber-300",
      border: "border-amber-100/80 dark:border-amber-900/40",
    },
    {
      bg: "bg-teal-50/80 dark:bg-teal-950/30",
      text: "text-teal-600 dark:text-teal-300",
      border: "border-teal-100/80 dark:border-teal-900/40",
    },
    {
      bg: "bg-violet-50/80 dark:bg-violet-950/30",
      text: "text-violet-600 dark:text-violet-300",
      border: "border-violet-100/80 dark:border-violet-900/40",
    },
  ];
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const getDeptColor = (dept) => {
  if (!dept) return "text-slate-500 dark:text-slate-400";
  const d = dept.toLowerCase().trim();
  if (d.includes("marketing") || d.includes("digital") || d === "dm") {
    return "text-blue-600 dark:text-blue-400";
  }
  if (
    d.includes("design") ||
    d.includes("creative") ||
    d.includes("branding") ||
    d === "gd"
  ) {
    return "text-purple-600 dark:text-purple-400";
  }
  if (
    d.includes("development") ||
    d.includes("tech") ||
    d.includes("website") ||
    d.includes("web") ||
    d === "dev"
  ) {
    return "text-emerald-600 dark:text-emerald-400";
  }
  if (d.includes("seo")) {
    return "text-amber-600 dark:text-amber-400";
  }
  if (
    d.includes("video") ||
    d.includes("production") ||
    d.includes("shoot") ||
    d === "vp"
  ) {
    return "text-rose-600 dark:text-rose-400";
  }
  if (
    d.includes("accounts") ||
    d.includes("finance") ||
    d.includes("sales") ||
    d === "acc"
  ) {
    return "text-teal-600 dark:text-teal-400";
  }
  return "text-indigo-600 dark:text-indigo-400";
};

const getDeptShortName = (d) => {
  if (!d) return "";
  const str = d.trim();
  const lower = str.toLowerCase();

  if (
    lower.includes("digital marketing") ||
    lower === "dm" ||
    lower.includes("marketing")
  )
    return "DM";
  if (
    lower.includes("graphic design") ||
    lower.includes("designer") ||
    lower.includes("design") ||
    lower === "gd"
  )
    return "GD";
  if (
    lower.includes("video production") ||
    lower.includes("video") ||
    lower.includes("production") ||
    lower === "vp"
  )
    return "VP";
  if (
    lower.includes("web development") ||
    lower.includes("web developer") ||
    lower.includes("tech") ||
    lower.includes("website") ||
    lower === "dev"
  )
    return "DEV";
  if (lower.includes("seo")) return "SEO";
  if (
    lower.includes("content") ||
    lower.includes("copywriter") ||
    lower === "cw"
  )
    return "CW";
  if (
    lower.includes("accounts") ||
    lower.includes("finance") ||
    lower === "acc"
  )
    return "ACC";
  if (
    lower.includes("sales") ||
    lower.includes("bd") ||
    lower.includes("business dev")
  )
    return "BD";
  if (
    lower.includes("operation manager") ||
    lower.includes("operations") ||
    lower === "om"
  )
    return "OM";
  if (lower.includes("admin")) return "ADM";

  if (str.length <= 4) return str.toUpperCase();
  const words = str.split(/[\s_-]+/);
  if (words.length > 1) {
    return words
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .substring(0, 4);
  }
  return str.substring(0, 3).toUpperCase();
};

const MultiSelect = React.memo(({

  label,
  options,
  selectedValues,
  onChange,
  placeholder,
  icon: Icon,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  const toggleOption = (val) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter((v) => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options;
    const query = searchQuery.toLowerCase();
    return options.filter(
      (opt) =>
        (opt.label || "").toLowerCase().includes(query) ||
        (opt.subLabel || "").toLowerCase().includes(query),
    );
  }, [options, searchQuery]);

  // Group options if 'group' property exists
  const hasGrouping = filteredOptions.some((o) => o.group);

  const groupedOptions = useMemo(() => {
    if (!hasGrouping) return { "": filteredOptions };

    return filteredOptions.reduce((acc, opt) => {
      const g = opt.group || "Others";
      if (!acc[g]) acc[g] = [];
      acc[g].push(opt);
      return acc;
    }, {});
  }, [filteredOptions, hasGrouping]);

  return (
    <div className="relative">
      <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-405 uppercase tracking-wide mb-1 flex items-center gap-1.5">
        {Icon && <Icon size={12} className="text-slate-450" />}
        {label}
      </label>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-h-10 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black px-3.5 flex flex-wrap gap-1.5 items-center cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-[#3b82f6]/20 focus:border-blue-500 dark:focus:border-[#3b82f6] transition-all"
      >
        {selectedValues.length === 0 ? (
          <span className="text-xs text-slate-400 dark:text-slate-550 font-semibold">
            {placeholder}
          </span>
        ) : (
          selectedValues.map((val) => {
            const opt = options.find((o) => o.value === val);
            const displayLabel = opt ? opt.label : val;
            return (
              <span
                key={val}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-550/5 text-blue-600 border border-blue-200/50 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/40"
              >
                {opt && opt.avatarUrl !== undefined && (
                  <div className="shrink-0 -ml-1">
                    {opt.avatarUrl ? (
                      <img
                        src={opt.avatarUrl}
                        alt={displayLabel}
                        className="w-4 h-4 rounded-full object-cover border border-slate-200/80 dark:border-slate-800"
                      />
                    ) : (
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-black ${
                          getUserColor(val).bg
                        } ${getUserColor(val).text} border ${
                          getUserColor(val).border
                        }`}
                      >
                        {displayLabel
                          ? displayLabel.charAt(0).toUpperCase()
                          : "?"}
                      </div>
                    )}
                  </div>
                )}
                {displayLabel}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOption(val);
                  }}
                  className="hover:text-rose-500 dark:hover:text-rose-400 transition-colors p-0.5 focus:outline-none"
                >
                  <FiX size={10} className="stroke-[3]" />
                </button>
              </span>
            );
          })
        )}
        <span className="ml-auto pointer-events-none text-slate-400">
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-[#334155] rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto p-1.5 space-y-1">
            {/* Search Input Box */}
            <div className="sticky top-0 bg-white dark:bg-slate-900 pb-1.5 pt-0.5 px-1 z-10 border-b border-slate-100 dark:border-slate-800 mb-1 flex items-center gap-2">
              <FiSearch className="text-slate-400 shrink-0" size={13} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full bg-slate-50 dark:bg-[#0f172a] text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#334155] outline-none focus:border-emerald-500 text-slate-800 dark:text-white transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchQuery("");
                  }}
                  className="text-slate-450 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                >
                  <FiX size={12} />
                </button>
              )}
            </div>

            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-slate-400 dark:text-slate-550 text-xs italic">
                No results found
              </div>
            ) : (
              Object.entries(groupedOptions).map(([groupName, items]) => (
                <div key={groupName} className="space-y-0.5">
                  {groupName && (
                    <div className="px-3 py-1 text-[9px] font-black text-indigo-600 dark:text-[#3b82f6] uppercase tracking-wider bg-indigo-50/40 dark:bg-white/[0.02] rounded-md mb-1 mt-1 font-bold">
                      {groupName}
                    </div>
                  )}
                  {items.map((opt) => {
                    const isSelected = selectedValues.includes(opt.value);
                    return (
                      <div
                        key={opt.value}
                        onClick={() => toggleOption(opt.value)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-indigo-500/5 text-indigo-600 dark:bg-[#3b82f6]/5 dark:text-[#3b82f6]"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-705 dark:text-slate-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded text-indigo-600 dark:text-[#3b82f6] focus:ring-indigo-500 w-3.5 h-3.5 border-slate-350 dark:border-slate-700 bg-transparent cursor-pointer"
                        />
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {opt.avatarUrl !== undefined && (
                            <div className="shrink-0">
                              {opt.avatarUrl ? (
                                <img
                                  src={opt.avatarUrl}
                                  alt={opt.label}
                                  className="w-6 h-6 rounded-full object-cover border border-slate-200 dark:border-slate-800"
                                />
                              ) : (
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-black text-[9px] ${
                                    getUserColor(opt.value).bg
                                  } ${getUserColor(opt.value).text} border ${
                                    getUserColor(opt.value).border
                                  }`}
                                >
                                  {opt.label
                                    ? opt.label.charAt(0).toUpperCase()
                                    : "?"}
                                </div>
                              )}
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-[11px] truncate">
                              {opt.label}
                            </span>
                            {opt.subLabel && (
                              <span className="text-[9px] text-slate-400 dark:text-slate-550 font-medium truncate">
                                {opt.subLabel}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
});

const IndustryCombobox = React.memo(({ value, onChange, existingIndustries = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(value || "");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = React.useRef(null);
  const inputRef = React.useRef(null);

  const defaultIndustries = useMemo(
    () => [
      "Technology",
      "Software & IT Services",
      "E-Commerce & Retail",
      "Healthcare & Medical",
      "Finance & Banking",
      "Real Estate & Property",
      "Education & EdTech",
      "Hospitality & Tourism",
      "Food & Beverages",
      "Manufacturing & Industrial",
      "Media & Entertainment",
      "Fashion & Lifestyle",
      "Automotive",
      "Digital Marketing & Agency",
      "Logistics & Supply Chain",
      "Construction & Architecture",
      "Fitness & Wellness",
      "Legal & Professional Services",
      "Agriculture",
      "Other",
    ],
    []
  );

  const allIndustryOptions = useMemo(() => {
    const list = [...(existingIndustries || []), ...defaultIndustries];
    const unique = [];
    list.forEach((item) => {
      if (item && !unique.some((u) => u.toLowerCase() === item.toLowerCase())) {
        unique.push(item);
      }
    });
    return unique;
  }, [existingIndustries, defaultIndustries]);

  useEffect(() => {
    setSearch(value || "");
  }, [value]);

  const filteredOptions = useMemo(() => {
    if (!search || !search.trim()) return allIndustryOptions;
    const q = search.toLowerCase().trim();
    return allIndustryOptions.filter((item) =>
      item.toLowerCase().includes(q)
    );
  }, [allIndustryOptions, search]);

  const exactMatchExists = useMemo(() => {
    if (!search || !search.trim()) return true;
    const q = search.toLowerCase().trim();
    return allIndustryOptions.some((item) => item.toLowerCase() === q);
  }, [allIndustryOptions, search]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        if (isOpen) {
          if (search.trim() && search.trim() !== (value || "").trim()) {
            onChange(search.trim());
          }
          setIsOpen(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, search, value, onChange]);

  const selectIndustry = (val) => {
    const cleanVal = (val || "").trim();
    setSearch(cleanVal);
    onChange(cleanVal);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();

      if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
        selectIndustry(filteredOptions[highlightedIndex]);
        return;
      }

      if (search.trim()) {
        selectIndustry(search.trim());
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else {
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
      }
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (isOpen) {
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
      }
      return;
    }

    if (e.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className={`client-modal-input-wrap flex items-center w-full h-10 px-3.5 border rounded-xl transition-all duration-200 shadow-2xs group ${
          isOpen
            ? "bg-white dark:bg-[#1e293b] ring-2 ring-emerald-500/20 border-emerald-500 dark:border-emerald-400"
            : "border-slate-200 dark:border-[#334155] bg-slate-50/80 dark:bg-[#1e293b]/70 hover:border-slate-300 dark:hover:border-[#475569] focus-within:bg-white dark:focus-within:bg-[#1e293b] focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 dark:focus-within:border-emerald-400"
        }`}
      >
        <FiLayers
          size={14}
          className="text-slate-400 dark:text-slate-500 mr-3 shrink-0 group-focus-within:theme-text-accent transition-colors duration-300"
        />

        <input
          ref={inputRef}
          type="text"
          value={search}
          placeholder="Select from list or type & press Enter..."
          onChange={(e) => {
            setSearch(e.target.value);
            if (!isOpen) setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-[13px] text-slate-800 dark:text-slate-100 font-semibold placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />

        {search && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSearch("");
              onChange("");
              inputRef.current?.focus();
            }}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors mr-1 cursor-pointer"
            title="Clear"
          >
            <FiX size={13} />
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-transform cursor-pointer"
        >
          <FiChevronDown
            size={15}
            className={`transition-transform duration-200 ${isOpen ? "rotate-180 text-[var(--accent-color)]" : ""}`}
          />
        </button>
      </div>

      {/* DROPDOWN MENU */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-[#334155] rounded-xl shadow-2xl p-1.5 max-h-60 overflow-y-auto custom-scrollbar space-y-1"
          >
            {/* Custom option when typing something not strictly in the list */}
            {search.trim() && !exactMatchExists && (
              <div
                onClick={() => selectIndustry(search.trim())}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-[var(--accent-color)]/10 text-[var(--accent-color)] dark:text-[var(--accent-color-dark)] hover:bg-[var(--accent-color)]/20 cursor-pointer border border-[var(--accent-color)]/25 transition-all mb-1 font-bold text-xs group"
              >
                <div className="flex items-center gap-2 truncate">
                  <FiPlusCircle size={14} className="shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="truncate">Add custom &ldquo;{search.trim()}&rdquo;</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-[var(--accent-color)]/20 dark:bg-[var(--accent-color)]/30 px-2 py-0.5 rounded-md shrink-0 ml-2">
                  Enter ↵
                </span>
              </div>
            )}

            {filteredOptions.length === 0 && exactMatchExists ? (
              <div className="py-4 text-center text-xs text-slate-400 font-medium">
                No matching industries
              </div>
            ) : (
              filteredOptions.map((item, idx) => {
                const isSelected = (value || "").toLowerCase() === item.toLowerCase();
                const isHighlighted = idx === highlightedIndex;
                return (
                  <div
                    key={item}
                    onClick={() => selectIndustry(item)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                      isSelected
                        ? "bg-[var(--accent-color)]/15 text-[var(--accent-color)] dark:text-[var(--accent-color-dark)] font-bold"
                        : isHighlighted
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <span className="truncate">{item}</span>
                    {isSelected && (
                      <FiCheck
                        size={14}
                        className="text-[var(--accent-color)] dark:text-[var(--accent-color-dark)] shrink-0 ml-2"
                      />
                    )}
                  </div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

const formatDept = (d) => {
  if (!d) return "";
  const str = d.trim();
  if (str.length <= 3) return str.toUpperCase();
  const words = str.split(/[\s_-]+/);
  if (words.length > 1) {
    return words
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .substring(0, 3);
  }
  return str.substring(0, 3).toUpperCase();
};


const INITIAL_CLIENT_FORM = {
  companyName: "",
  industry: "",
  onboardingDate: new Date().toISOString().split("T")[0],
  phoneNumber: "",
  spoc: "",
  designation: "",
  budget: "",
  gst: "",
  totalBudget: "",
  service: [],
  reels: "",
  posts: "",
  story: "",
  needDslr: "",
  pages: "",
  onpage: false,
  offpage: false,
  assignedTo: [],
  color: "#3b82f6",
  icon: "FaRegBuilding",
  status: "Active",
  authMethods: [],
};

const Clients = () => {
  const dispatch = useDispatch();

  const { clients, loading } = useSelector((state) => state.clients);
  const { users } = useSelector((state) => state.users);
  const { user } = useSelector((state) => state.auth);
  const { projects } = useSelector((state) => state.projects);
  const { tasks } = useSelector((state) => state.tasks);
  const { theme } = useTheme();

  const deptLower = (
    user?.department ||
    user?.profile?.department ||
    ""
  ).toLowerCase();
  const roleLower = (user?.role || "").toLowerCase().replace(/[\s_-]+/g, "");
  const desigLower = (user?.designation || "").toLowerCase();

  const isFinance =
    deptLower.includes("finance") ||
    deptLower.includes("account") ||
    roleLower === "finance" ||
    roleLower === "accountant" ||
    desigLower.includes("finance") ||
    desigLower.includes("account");

  const isSocialMediaManager =
    roleLower === "socialmediamanager" ||
    roleLower === "socialmediahead" ||
    deptLower.includes("social media head") ||
    location.pathname.includes("/socialmediamanager");

  const canManageClients =
    roleLower === "admin" ||
    roleLower === "operationmanager" ||
    isFinance ||
    isSocialMediaManager;

  const canViewBudget =
    (roleLower === "admin" || roleLower === "operationmanager" || isFinance) &&
    !isSocialMediaManager;

  const hasFullAccess = canManageClients;

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceFilter, setServiceFilter] = useState("All");
  const [clientNameFilter, setClientNameFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [memberFilter, setMemberFilter] = useState("All");
  const [showMemberFilterDropdown, setShowMemberFilterDropdown] =
    useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [viewClient, setViewClient] = useState(null);
  const [showViewOffcanvas, setShowViewOffcanvas] = useState(false);
  const [viewOffcanvasTab, setViewOffcanvasTab] = useState("Overview");
  const [activeTab, setActiveTab] = useState("profile"); // 'profile', 'service', 'finance'
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [editRowData, setEditRowData] = useState(null);

  const predefinedAuthMethods = [
    {
      method: "Email OTP",
      subtitle: "OTP will be sent to email",
      defaultStatus: "Not Configured",
    },
    {
      method: "WhatsApp OTP",
      subtitle: "OTP will be sent via WhatsApp",
      defaultStatus: "Not Configured",
    },
    {
      method: "Two-Factor Authentication",
      subtitle: "Additional layer of security",
      defaultStatus: "Not Configured",
    },
    {
      method: "SMS / Message OTP",
      subtitle: "OTP will be sent via SMS",
      defaultStatus: "Not Configured",
    },
    {
      method: "Voice Call OTP",
      subtitle: "OTP will be sent via voice call",
      defaultStatus: "Not Configured",
    },
    {
      method: "Authenticator App",
      subtitle: "TOTP / Authenticator app",
      defaultStatus: "Not Configured",
    },
    {
      method: "Selfie Verification",
      subtitle: "Verify using selfie",
      defaultStatus: "Disabled",
    },
    {
      method: "Backup Codes",
      subtitle: "Use backup codes to login",
      defaultStatus: "Not Configured",
    },
  ];
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(7);


  const initialForm = INITIAL_CLIENT_FORM;

  const [formData, setFormData] = useState(initialForm);

  const handleServiceChange = useCallback((services) => {
    setFormData((prev) => ({
      ...prev,
      service: services,
    }));
  }, []);

  const handleAssignedChange = useCallback((assigned) => {
    setFormData((prev) => ({
      ...prev,
      assignedTo: assigned,
    }));
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

  const calculateTotal = useCallback(() => {
    const budget = Number(formData.budget || 0);
    const gst = Number(formData.gst || 0);
    return budget + (budget * gst) / 100;
  }, [formData.budget, formData.gst]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.companyName || formData.companyName.trim() === "") {
      toast.error("Company Name is required");
      return;
    }
    
    if (!formData.industry || formData.industry.trim() === "") {
      toast.error("Industry is required");
      return;
    }
    
    // Phone number is optional

    if (!formData.service || formData.service.length === 0) {
      toast.error("Please select at least one service");
      return;
    }

    const payload = {
      ...formData,
      budget: formData.budget === "" ? 0 : Number(formData.budget),
      gst: formData.gst === "" ? 18 : Number(formData.gst),
      reels: formData.reels === "" ? 0 : Number(formData.reels),
      posts: formData.posts === "" ? 0 : Number(formData.posts),
      story: formData.story === "" ? 0 : Number(formData.story),
      pages: formData.pages === "" ? 0 : Number(formData.pages),
      totalBudget: calculateTotal(),
    };

    if (!canViewBudget) {
      delete payload.budget;
      delete payload.gst;
      delete payload.totalBudget;
    }

    if (!payload.assignedTo) {
      delete payload.assignedTo;
    }

    try {
      if (editId) {
        await dispatch(updateClient({ id: editId, data: payload })).unwrap();
        toast.success("Client updated successfully");
      } else {
        await dispatch(createClient(payload)).unwrap();
        toast.success("Client created successfully");
      }

      setShowModal(false);
      setFormData(initialForm);
      setEditId(null);
    } catch (err) {
      toast.error(err || "Failed to save client");
    }
  };

  
  const handleNextStep = () => {
    if (activeTab === "profile") {
      if (!formData.companyName || formData.companyName.trim() === "") {
        toast.error("Company Name is required");
        return;
      }
      if (!formData.industry || formData.industry.trim() === "") {
        toast.error("Industry Sector is required");
        return;
      }
      setActiveTab("branding");
    } else if (activeTab === "branding") {
      setActiveTab("service");
    } else if (activeTab === "service") {
      if (!formData.service || formData.service.length === 0) {
        toast.error("Please select at least one service");
        return;
      }
      if (canViewBudget) {
        setActiveTab("finance");
      }
    }
  };

  const handleEdit = (client) => {
    setFormData({
      ...client,
      color: client.color || "#3b82f6",
      icon: client.icon || "FaRegBuilding",
      status: client.status || "Active",
      spoc: client.spoc || "",
      designation: client.designation || "",
      onboardingDate: client.onboardingDate
        ? new Date(client.onboardingDate).toISOString().split("T")[0]
        : "",
      service: Array.isArray(client.service)
        ? client.service
        : client.service
          ? [client.service]
          : [],
      assignedTo: Array.isArray(client.assignedTo)
        ? client.assignedTo.map((u) => u._id || u)
        : client.assignedTo
          ? [client.assignedTo._id || client.assignedTo]
          : [],
      authMethods: client.authMethods || [],
    });
    setEditId(client._id);
    setActiveTab("profile");
    setShowModal(true);
  };

  
  // Escape modal listener
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && showModal) {
        setShowModal(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [showModal]);

  const handleStatusChange = async (client, newStatus) => {
    if (client.status === newStatus) return;

    let reason = "";
    if (newStatus === "Inactive") {
      reason = window.prompt(
        "Please enter a reason for making the client Inactive:",
      );
      if (reason === null) return; // User cancelled
    }

    const payload = {
      ...client,
      status: newStatus,
      inactiveReason: reason,
      assignedTo: Array.isArray(client.assignedTo)
        ? client.assignedTo.map((u) => u._id || u)
        : client.assignedTo
          ? [client.assignedTo._id || client.assignedTo]
          : [],
    };
    await dispatch(updateClient({ id: client._id, data: payload }));
  };

  const allUsers = useMemo(() => {
    return users || [];
  }, [users]);

  // Instant O(1) Lookups for User details and Project counts (Performance Optimization)
  const userMap = useMemo(() => {
    const map = new Map();
    if (users && Array.isArray(users)) {
      for (let i = 0; i < users.length; i++) {
        const u = users[i];
        if (u._id) map.set(String(u._id), u);
        if (u.id) map.set(String(u.id), u);
      }
    }
    return map;
  }, [users]);

  const projectCounts = useMemo(() => {
    const map = {};
    if (projects && Array.isArray(projects)) {
      for (let i = 0; i < projects.length; i++) {
        const p = projects[i];
        const cId = p.client?._id || p.client;
        if (cId) {
          map[String(cId)] = (map[String(cId)] || 0) + 1;
        }
      }
    }
    return map;
  }, [projects]);

  const uniqueClientNames = useMemo(() => {
    if (!clients) return [];
    const names = clients.map((c) => c.companyName).filter(Boolean);
    return [...new Set(names)].sort((a, b) => a.localeCompare(b));
  }, [clients]);

  const uniqueIndustries = useMemo(() => {
    if (!clients) return [];
    const industries = clients.map((c) => c.industry).filter(Boolean);
    return [...new Set(industries)].sort((a, b) => a.localeCompare(b));
  }, [clients]);

  const filteredClients = useMemo(() => {
    return (
      (clients || [])
        .filter((client) => {
          const matchesSearch =
            (client.companyName || "")
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            (client.industry || "")
              .toLowerCase()
              .includes(searchTerm.toLowerCase());

          const matchesService =
            serviceFilter === "All"
              ? true
              : Array.isArray(client.service)
                ? client.service.includes(serviceFilter)
                : client.service === serviceFilter;

          const matchesClientName =
            clientNameFilter === "All"
              ? true
              : client.companyName === clientNameFilter;

          const matchesStatus =
            statusFilter === "All" ? true : client.status === statusFilter;

          const matchesMember =
            memberFilter === "All"
              ? true
              : Array.isArray(client.assignedTo)
                ? client.assignedTo.some((m) => (m._id || m) === memberFilter)
                : client.assignedTo &&
                  (client.assignedTo._id || client.assignedTo) === memberFilter;

          return (
            matchesSearch &&
            matchesService &&
            matchesClientName &&
            matchesStatus &&
            matchesMember
          );
        })
        // Sort A → Z by company name (ascending)
        .sort((a, b) =>
          (a.companyName || "").localeCompare(b.companyName || "", undefined, {
            sensitivity: "base",
          }),
        )
    );
  }, [
    clients,
    searchTerm,
    serviceFilter,
    clientNameFilter,
    memberFilter,
    statusFilter,
  ]);

  // Reset pagination to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, serviceFilter, clientNameFilter, memberFilter, statusFilter]);

  const totalItems = filteredClients.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredClients.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredClients, currentPage, itemsPerPage]);

  // Dynamic Service-Based styling helpers
  const getServiceStyles = (service) => {
    switch (service) {
      case "Digital Marketing":
        return {
          bg: "bg-blue-50/50 dark:bg-blue-950/10",
          text: "text-blue-600 dark:text-blue-400",
          border: "border-blue-100 dark:border-blue-900/30",
          pill: "bg-blue-50 text-blue-705 border-blue-200/50 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800/50",
          gradient: "from-blue-550 to-cyan-500",
          icon: FiLayers,
        };
      case "Website":
        return {
          bg: "bg-emerald-50/50 dark:bg-emerald-950/10",
          text: "text-emerald-600 dark:text-emerald-400",
          border: "border-emerald-100 dark:border-emerald-900/30",
          pill: "bg-emerald-50 text-emerald-707 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/50",
          gradient: "from-emerald-550 to-teal-500",
          icon: FiGlobe,
        };
      case "SEO":
        return {
          bg: "bg-purple-50/50 dark:bg-purple-950/10",
          text: "text-purple-600 dark:text-purple-400",
          border: "border-purple-100 dark:border-purple-900/30",
          pill: "bg-purple-50 text-purple-705 border-purple-200/50 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-800/50",
          gradient: "from-purple-550 to-pink-500",
          icon: FiSearch,
        };
      case "Additional work":
        return {
          bg: "bg-amber-50/50 dark:bg-amber-950/10",
          text: "text-amber-600 dark:text-amber-400",
          border: "border-amber-100 dark:border-amber-900/30",
          pill: "bg-amber-50 text-amber-705 border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800/50",
          gradient: "from-amber-550 to-orange-500",
          icon: FiPlusCircle,
        };
      case "Video Production":
        return {
          bg: "bg-rose-50/50 dark:bg-rose-950/10",
          text: "text-rose-600 dark:text-rose-400",
          border: "border-rose-100 dark:border-rose-900/30",
          pill: "bg-rose-50 text-rose-705 border-rose-200/50 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-800/50",
          gradient: "from-rose-550 to-red-500",
          icon: FiVideo,
        };
      case "Others":
        return {
          bg: "bg-teal-50/50 dark:bg-teal-950/10",
          text: "text-teal-605 dark:text-teal-400",
          border: "border-teal-100 dark:border-teal-900/30",
          pill: "bg-teal-50 text-teal-705 border-teal-200/50 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-800/50",
          gradient: "from-teal-550 to-emerald-500",
          icon: FiHelpCircle,
        };
      default:
        return {
          bg: "bg-slate-50/50 dark:bg-slate-800/20",
          text: "text-slate-605 dark:text-slate-400",
          border: "border-slate-100 dark:border-slate-800",
          pill: "bg-slate-50 text-slate-650 border border-slate-200/50 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800",
          gradient: "from-slate-500 to-slate-755",
          icon: FiBriefcase,
        };
    }
  };

  const totalClientsCount = (clients || []).length;
  const activeClientsCount = (clients || []).filter(
    (c) => !c.status || c.status === "Active",
  ).length;
  const inactiveClientsCount = (clients || []).filter(
    (c) => c.status === "Inactive",
  ).length;

  return (
    <div className="min-h-screen pb-12 transition-colors duration-300">
      {/* QUICK METRICS & STATUS TABS (No.of Clients & Active/Inactive filter) */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-1.5 sm:gap-2 sidebar-bg p-1.5 rounded-2xl shadow-2xs">
          {/* All Clients Tab */}
          <button
            type="button"
            onClick={() => setStatusFilter("All")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "All"
                ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <FiBriefcase
              size={13}
              className={
                statusFilter === "All" ? "text-blue-500" : "opacity-60"
              }
            />
            <span>All Clients</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                statusFilter === "All"
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              {totalClientsCount}
            </span>
          </button>

          {/* Active Clients Tab */}
          <button
            type="button"
            onClick={() => setStatusFilter("Active")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "Active"
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-sm ring-1 ring-emerald-300 dark:ring-emerald-700"
                : "text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active Clients</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
              {activeClientsCount}
            </span>
          </button>

          {/* Inactive Clients Tab */}
          <button
            type="button"
            onClick={() => setStatusFilter("Inactive")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "Inactive"
                ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 shadow-sm ring-1 ring-rose-300 dark:ring-rose-700"
                : "text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Inactive Clients</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100/80 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
              {inactiveClientsCount}
            </span>
          </button>
        </div>

        {/* Filter Results Count Indicator */}
        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <span>Showing:</span>
          <span className="px-2.5 py-1 rounded-lg sidebar-bg text-slate-700 dark:text-slate-200 font-extrabold shadow-2xs">
            {filteredClients.length} of {totalClientsCount} Clients
          </span>
        </div>
      </div>

      {/* SEARCH + FILTER CONTROLS */}
      <div className=" mb-6 flex flex-col md:flex-row items-center justify-between ">
        {/* LEFT: Search & Filter */}
        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full md:w-auto">
          {/* SEARCH BOX */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search company or industry..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl sidebar-bg text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium placeholder:text-slate-300 dark:placeholder:text-slate-600"
            />
          </div>

          {/* CLIENT NAME FILTER */}
          <div className="relative w-full sm:w-52">
            <select
              value={clientNameFilter}
              onChange={(e) => setClientNameFilter(e.target.value)}
              className="w-full h-10 pl-3.5 pr-8 rounded-xl sidebar-bg text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold cursor-pointer appearance-none"
            >
              <option value="All">All Clients</option>
              {uniqueClientNames.map((name, idx) => (
                <option key={idx} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          {/* STATUS FILTER */}
          <div className="relative w-full sm:w-40">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 pl-3.5 pr-8 rounded-xl sidebar-bg text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold cursor-pointer appearance-none"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          {/* SERVICE FILTER */}
          <div className="relative w-full sm:w-52">
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="w-full h-10 pl-3.5 pr-8 rounded-xl sidebar-bg text-xs text-slate-800 dark:text-white outline-none  transition-all font-semibold cursor-pointer appearance-none"
            >
              <option value="All">All Services</option>
              <option value="Digital Marketing">Digital Marketing</option>
              <option value="Website">Website Development</option>
              <option value="SEO">SEO Strategy</option>
              <option value="Additional work">Additional work</option>
              <option value="Video Production">Video Production</option>
              <option value="Others">Others</option>
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          {/* MEMBERS FILTER */}
          <div className="relative w-full sm:w-52">
            <div
              onClick={() =>
                setShowMemberFilterDropdown(!showMemberFilterDropdown)
              }
              className="w-full h-10 pl-3.5 pr-8 rounded-xl sidebar-bg text-xs text-slate-800 dark:text-white outline-none flex items-center transition-all font-semibold cursor-pointer"
            >
              {memberFilter === "All"
                ? "All Members"
                : (() => {
                    const selectedUser = allUsers.find(
                      (u) => u._id === memberFilter,
                    );
                    if (!selectedUser) return "All Members";
                    return (
                      <div className="flex items-center gap-2">
                        {renderUserAvatarSmall(
                          selectedUser,
                          "w-5 h-5 text-[9px] shrink-0",
                        )}
                        <span className="truncate">
                          {selectedUser.name || selectedUser.email}
                        </span>
                      </div>
                    );
                  })()}
            </div>

            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>

            {showMemberFilterDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMemberFilterDropdown(false)}
                />
                <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto no-scrollbar">
                  <div
                    className={`px-3 py-2 text-xs font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 ${memberFilter === "All" ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20" : "text-slate-700 dark:text-slate-300"}`}
                    onClick={() => {
                      setMemberFilter("All");
                      setShowMemberFilterDropdown(false);
                    }}
                  >
                    All Members
                  </div>

                  {(() => {
                    const depts = {};
                    allUsers.forEach((u) => {
                      const dept = u.department || "Other";
                      if (!depts[dept]) depts[dept] = [];
                      depts[dept].push(u);
                    });

                    const sortedDepts = Object.keys(depts).sort();

                    return sortedDepts.map((dept) => (
                      <div key={dept}>
                        <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider sticky top-0 border-y border-slate-100 dark:border-slate-800/50 z-10 backdrop-blur-sm">
                          {dept}
                        </div>
                        {depts[dept]
                          .sort((a, b) =>
                            (a.name || a.email).localeCompare(
                              b.name || b.email,
                            ),
                          )
                          .map((u) => (
                            <div
                              key={u._id}
                              className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${memberFilter === u._id ? "bg-blue-50 dark:bg-blue-900/10" : ""}`}
                              onClick={() => {
                                setMemberFilter(u._id);
                                setShowMemberFilterDropdown(false);
                              }}
                            >
                              {renderUserAvatarSmall(
                                u,
                                "w-6 h-6 text-[10px] shrink-0",
                              )}
                              <span
                                className={`truncate ${memberFilter === u._id ? "text-blue-700 dark:text-blue-400 font-bold" : "text-slate-700 dark:text-slate-200"}`}
                              >
                                {u.name || u.email}
                              </span>
                            </div>
                          ))}
                      </div>
                    ));
                  })()}
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT: Add Button */}
        <div>
          {hasFullAccess && (
            <button
              onClick={() => {
                setFormData(initialForm);
                setEditId(null);
                setActiveTab("profile");
                setShowModal(true);
              }}
              className="dashboard-btn-primary px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-xs font-semibold active:scale-[0.98] transition-all cursor-pointer"
            >
              <FiPlus size={15} className="stroke-[3]" />
              Add Client
            </button>
          )}
        </div>
      </div>

      {/* LOADING LOADER */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 border-[3.5px] border-slate-205 border-t-[var(--accent-color)] rounded-full animate-spin"></div>
          <span className="text-xs text-slate-400 font-semibold animate-pulse">
            Syncing client details...
          </span>
        </div>
      )}

      {/* MAIN CONTENT TABLE */}
      {!loading && (
        <motion.div layout className="overflow-hidden theme-bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left  whitespace-nowrap min-w-275 text-xs">
              <thead>
                <tr className=" text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest text-[10px]">
                  <th className="px-4 py-3 font-extrabold bg-transparent text-left w-[190px]">
                    <div className="flex items-center justify-start gap-1.5">
                      <FaRegBuilding size={12} className="opacity-70" />
                      Client
                    </div>
                  </th>
                  <th className="px-4 py-3 font-extrabold bg-transparent text-center  w-20">
                    Status
                  </th>
                  <th className="px-4 py-3 font-extrabold bg-transparent text-center  w-14">
                    Projects
                  </th>
                  <th className="px-4 py-3 font-extrabold bg-transparent text-left w-[380px] ">
                    Service & Members
                  </th>
                  <th className="px-4 py-3 font-extrabold bg-transparent text-left w-[280px] ">
                    Deliverables
                  </th>

                  {canViewBudget && (
                    <th className="px-4 py-3 font-extrabold bg-transparent text-left w-36">
                      <div className="flex items-center gap-1.5">
                        <FiDollarSign size={12} className="opacity-70" />
                        Budget Details
                      </div>
                    </th>
                  )}

                  {user?.role === "team" && !isFinance && (
                    <th className="px-4 py-3 font-extrabold bg-transparent text-center  last:border-r-0">
                      Assigned By
                    </th>
                  )}
                  <th className="px-4 py-3 font-extrabold bg-transparent text-center w-20 border-r-0">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                <AnimatePresence>
                  {filteredClients.length > 0 ? (
                    paginatedClients.map((client, index) => {
                      const primaryService = Array.isArray(client.service)
                        ? client.service[0] || ""
                        : client.service || "";
                      const conf = getServiceStyles(primaryService);
                      const ServiceIcon = conf.icon;

                      const cellClass =
                        "px-4 py-2.5 bg-transparent transition-colors border-r border-slate-200 dark:border-slate-700/60 last:border-r-0";

                      const nameColors = [
                        "text-blue-900 dark:text-blue-400",
                        "text-purple-700 dark:text-purple-400",
                        "text-emerald-600 dark:text-emerald-400",
                        "text-rose-600 dark:text-rose-400",
                        "text-amber-650 dark:text-amber-400",
                        "text-cyan-600 dark:text-cyan-400",
                        "text-indigo-600 dark:text-indigo-400",
                        "text-pink-600 dark:text-pink-400",
                        "text-yellow-500 dark:text-yellow-400",
                      ];

                      // Create a simple hash based on company name length and char codes
                      let hash = 0;
                      if (client.companyName) {
                        for (let i = 0; i < client.companyName.length; i++) {
                          hash =
                            client.companyName.charCodeAt(i) +
                            ((hash << 5) - hash);
                        }
                      }
                      const nameHexes = [
                        "#3b82f6", // blue
                        "#8b5cf6", // violet
                        "#10b981", // emerald
                        "#f43f5e", // rose
                        "#f59e0b", // amber
                        "#06b6d4", // cyan
                        "#6366f1", // indigo
                        "#ec4899", // pink
                        "#eab308", // yellow
                      ];
                      const colorIndex = Math.abs(hash) % nameColors.length;
                      const nameColor = nameColors[colorIndex];
                      const clientColor =
                        client.color && client.color !== "#3b82f6"
                          ? client.color
                          : nameHexes[colorIndex];

                      return (
                        <motion.tr
                          layout
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2, delay: index * 0.02 }}
                          key={client._id || client.id || `client-row-${index}`}
                          className={`group transition-colors ${
                            client.status === "Inactive"
                              ? "bg-rose-50/80 dark:bg-rose-950/30 hover:bg-rose-100/80 dark:hover:bg-rose-950/50"
                              : "hover:bg-slate-50/40 dark:hover:bg-[#16223f]/40"
                          } border-b border-slate-200 dark:border-slate-700/60`}
                        >
                          <td className={`${cellClass} relative`}>
                            <div className="flex items-center gap-2.5">
                              {(() => {
                                const ClientIcon = getClientIconComponent(
                                  client.icon,
                                );
                                return (
                                  <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border shadow-sm transition-all duration-300"
                                    style={{
                                      backgroundColor: `${clientColor}12`,
                                      borderColor: `${clientColor}30`,
                                      color: clientColor,
                                    }}
                                  >
                                    <ClientIcon size={14} />
                                  </div>
                                );
                              })()}
                              <div className="min-w-[110px]">
                                <h2
                                  className={`font-bold transition-colors text-[12.5px] text-slate-800 dark:text-slate-900 truncate max-w-[200px] ${
                                    hasFullAccess ||
                                    (user?.department || "")
                                      .toLowerCase()
                                      .includes("social media")
                                      ? "cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                                      : ""
                                  }`}
                                  onClick={() => {
                                    if (
                                      hasFullAccess ||
                                      (user?.department || "")
                                        .toLowerCase()
                                        .includes("social media")
                                    ) {
                                      setViewClient(client);
                                      setShowViewOffcanvas(true);
                                    }
                                  }}
                                >
                                  {client.companyName}
                                </h2>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold bg-slate-100 dark:bg-[#16223f] px-1.5 py-0.5 rounded">
                                    {client.industry}
                                  </span>
                                  {client.onboardingDate && (
                                    <span className="text-[9px] text-black dark:text-white px-1.5 py-0.5 bg-slate-100 rounded dark:bg-[#16223f] font-medium flex items-center gap-1">
                                      <FiCalendar size={8} />
                                      {new Date(
                                        client.onboardingDate,
                                      ).toLocaleDateString("en-IN", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "2-digit",
                                      })}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td
                            className={`${cellClass} text-center w-32 align-middle px-2`}
                          >
                            <div className="flex flex-col items-center gap-1.5 justify-center py-1">
                              {hasFullAccess ? (
                                <select
                                  value={client.status || "Active"}
                                  onChange={(e) =>
                                    handleStatusChange(client, e.target.value)
                                  }
                                  className={`outline-none cursor-pointer pl-2 pr-6 py-1 rounded font-bold text-[10px] border text-center w-[95px] appearance-none relative bg-no-repeat bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[position:right_6px_center] ${
                                    client.status === "Inactive"
                                      ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-800/30"
                                      : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/30"
                                  }`}
                                >
                                  <option
                                    value="Active"
                                    className="text-emerald-600 font-bold"
                                  >
                                    Active
                                  </option>
                                  <option
                                    value="Inactive"
                                    className="text-rose-600 font-bold"
                                  >
                                    Inactive
                                  </option>
                                </select>
                              ) : (
                                <div
                                  className={`px-3 py-1 rounded font-bold text-[10px] border text-center w-[95px] ${
                                    client.status === "Inactive"
                                      ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-800/30"
                                      : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/30"
                                  }`}
                                >
                                  {client.status || "Active"}
                                </div>
                              )}
                              {client.status === "Inactive" &&
                                client.inactiveReason && (
                                  <div
                                    className="text-[8.5px] text-rose-500/90 dark:text-rose-400/90 italic bg-rose-50/50 dark:bg-rose-900/10 px-1.5 py-0.5 rounded w-full max-w-[110px] text-center leading-tight border border-rose-100/50 dark:border-rose-800/20 break-words"
                                    title={client.inactiveReason}
                                  >
                                    {client.inactiveReason}
                                  </div>
                                )}
                            </div>
                          </td>
                          <td className={`${cellClass} text-center w-28`}>
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold text-[10px] border border-blue-200/50 dark:border-blue-800/30">
                              {projects?.filter(
                                (p) =>
                                  p.client?._id === client._id ||
                                  p.client === client._id,
                              ).length || 0}
                            </span>
                          </td>
                          <td className={cellClass}>
                            <div className="flex flex-col gap-1.5 py-0.5">
                              {/* Service Pills (Digital Marketing, SEO, Website, etc.) */}
                              <div className="flex flex-wrap items-center gap-1.5">
                                {client.service &&
                                  (Array.isArray(client.service)
                                    ? client.service
                                    : [client.service || "Contract"]
                                  ).map((svc, idx) => {
                                    if (!svc) return null;
                                    const sConf = getServiceStyles(svc);
                                    const SIcon = sConf.icon;
                                    return (
                                      <span
                                        key={idx}
                                        className={`inline-flex px-2 py-0.5 rounded-full text-[8.5px] font-extrabold tracking-wider uppercase border ${sConf.pill} items-center gap-1 shadow-2xs whitespace-nowrap shrink-0`}
                                      >
                                        <SIcon size={9.5} />
                                        {svc}
                                      </span>
                                    );
                                  })}
                              </div>

                              {/* Members - User Name & Dept Name on Single Line */}
                              <div className="flex flex-wrap items-center gap-1.5 max-w-[380px]">
                                {client.assignedTo &&
                                (Array.isArray(client.assignedTo)
                                  ? client.assignedTo.length > 0
                                  : true) ? (
                                  Array.isArray(client.assignedTo) ? (
                                    client.assignedTo.map((member) => {
                                      const fullUser = userMap.get(String(member._id || member));
                                      const dept = fullUser?.department || "";
                                      const memberName =
                                        member.name || member.email || "Member";
                                      const formattedDept = dept
                                        ? dept.charAt(0).toUpperCase() +
                                          dept.slice(1)
                                        : "";
                                      return (
                                        <span
                                          key={member._id || member}
                                          className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-white dark:bg-slate-800 shadow-2xs border border-slate-200/80 dark:border-slate-700/60 transition-all hover:border-blue-400 dark:hover:border-blue-500 cursor-default whitespace-nowrap shrink-0 pr-2.5"
                                          title={`${memberName}${formattedDept ? ` · ${formattedDept}` : ""}`}
                                        >
                                          {renderUserAvatarSmall(
                                            fullUser,
                                            "w-5 h-5 text-[9px]",
                                          )}
                                          <span className="text-[10.5px] font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                            {memberName}
                                          </span>
                                          {formattedDept && (
                                            <>
                                              <span className="w-[1px] h-3 bg-slate-200 dark:bg-slate-700 shrink-0"></span>
                                              <span
                                                className={`text-[9px] font-bold ${getDeptColor(dept)} whitespace-nowrap`}
                                              >
                                                {formattedDept}
                                              </span>
                                            </>
                                          )}
                                        </span>
                                      );
                                    })
                                  ) : (
                                    (() => {
                                      const singleMember = client.assignedTo;
                                      const fullUser = userMap.get(String(singleMember._id || singleMember));
                                      const dept = fullUser?.department || "";
                                      const memberName =
                                        singleMember.name ||
                                        singleMember.email ||
                                        "Member";
                                      const formattedDept = dept
                                        ? dept.charAt(0).toUpperCase() +
                                          dept.slice(1)
                                        : "";
                                      return (
                                        <span
                                          className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-white dark:bg-slate-800 shadow-2xs border border-slate-200/80 dark:border-slate-700/60 transition-all hover:border-blue-400 dark:hover:border-blue-500 cursor-default whitespace-nowrap shrink-0 pr-2.5"
                                          title={`${memberName}${formattedDept ? ` · ${formattedDept}` : ""}`}
                                        >
                                          {renderUserAvatarSmall(
                                            fullUser,
                                            "w-5 h-5 text-[9px]",
                                          )}
                                          <span className="text-[10.5px] font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                            {memberName}
                                          </span>
                                          {formattedDept && (
                                            <>
                                              <span className="w-[1px] h-3 bg-slate-200 dark:bg-slate-700 shrink-0"></span>
                                              <span
                                                className={`text-[9px] font-bold ${getDeptColor(dept)} whitespace-nowrap`}
                                              >
                                                {formattedDept}
                                              </span>
                                            </>
                                          )}
                                        </span>
                                      );
                                    })()
                                  )
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-50/50 dark:bg-white/5 text-slate-400 dark:text-slate-500 italic text-[9.5px] whitespace-nowrap shrink-0">
                                    <FiUser size={9} />
                                    <span>Unassigned</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className={cellClass}>
                            <div className="flex flex-wrap items-center gap-2 max-w-[320px] py-1">
                              {client.posts > 0 && (
                                <span
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60 font-bold text-[10px]"
                                  title="Posts"
                                >
                                  <FiLayers
                                    size={11}
                                    className="text-blue-500"
                                  />
                                  {client.posts} Posts
                                </span>
                              )}
                              {client.reels > 0 && (
                                <span
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60 font-bold text-[10px]"
                                  title="Reels"
                                >
                                  <FiVideo
                                    size={11}
                                    className="text-purple-500"
                                  />
                                  {client.reels} Reels
                                </span>
                              )}
                              {client.story > 0 && (
                                <span
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60 font-bold text-[10px]"
                                  title="Stories"
                                >
                                  <FiVideo
                                    size={11}
                                    className="text-rose-500"
                                  />
                                  {client.story} Stories
                                </span>
                              )}
                              {client.needDslr &&
                                client.needDslr !== "No DSLR" && (
                                  <span
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 font-bold text-[10px]"
                                    title="DSLR Requirement"
                                  >
                                    <FiVideo
                                      size={11}
                                      className="text-amber-500"
                                    />
                                    DSLR: {client.needDslr}
                                  </span>
                                )}
                              {client.pages > 0 && (
                                <span
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 font-bold text-[10px]"
                                  title="Website Pages"
                                >
                                  <FiGlobe
                                    size={11}
                                    className="text-emerald-500"
                                  />
                                  {client.pages} Pages
                                </span>
                              )}
                              {client.onpage && (
                                <span
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200/80 dark:border-orange-800/60 font-bold text-[10px]"
                                  title="SEO On-Page"
                                >
                                  <FiSearch
                                    size={11}
                                    className="text-orange-500"
                                  />
                                  On-Page
                                </span>
                              )}
                              {client.offpage && (
                                <span
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200/80 dark:border-orange-800/60 font-bold text-[10px]"
                                  title="SEO Off-Page"
                                >
                                  <FiSearch
                                    size={11}
                                    className="text-orange-500"
                                  />
                                  Off-Page
                                </span>
                              )}
                              {!client.posts &&
                                !client.reels &&
                                !client.story &&
                                !client.pages &&
                                !client.onpage &&
                                !client.offpage && (
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500 italic px-1">
                                    No deliverables set.
                                  </span>
                                )}
                            </div>
                          </td>
                          {canViewBudget && (
                            <td className={`${cellClass} text-left w-36`}>
                              <div className="flex flex-col gap-0.5 py-1">
                                <div className="flex items-baseline gap-1 font-extrabold text-[12px] text-slate-800 dark:text-slate-100">
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">₹</span>
                                  <span>
                                    {Number(
                                      client.totalBudget || client.budget || 0
                                    ).toLocaleString("en-IN")}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-[9.5px] text-slate-500 dark:text-slate-400">
                                  <span>Base: ₹{Number(client.budget || 0).toLocaleString("en-IN")}</span>
                                  {client.gst ? (
                                    <span className="px-1 py-0.2 rounded text-[8.5px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                      +{client.gst}% GST
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </td>
                          )}
                          {user?.role === "team" && !isFinance && (
                            <td className={cellClass}>
                              <div className="flex items-center gap-1">
                                {client.createdBy ? (
                                  (() => {
                                    const uCol = getUserColor(
                                      client.createdBy._id || client.createdBy,
                                    );
                                    return (
                                      <span
                                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${uCol.bg} ${uCol.text} border ${uCol.border} font-bold text-[10.5px]`}
                                      >
                                        <FiUser size={10} />
                                        <span>
                                          {client.createdBy.name ||
                                            client.createdBy.email}
                                        </span>
                                      </span>
                                    );
                                  })()
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-dashed border-slate-205 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 text-slate-450 dark:text-slate-500 italic text-[10.5px]">
                                    <FiUser size={10} />
                                    <span>System / Admin</span>
                                  </span>
                                )}
                              </div>
                            </td>
                          )}
                          <td className={`${cellClass} text-center w-20`}>
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => {
                                    setViewClient(client);
                                    setShowViewOffcanvas(true);
                                  }}
                                  className="w-6 h-6 flex items-center justify-center bg-teal-50 dark:bg-teal-500/10 hover:bg-teal-100 dark:hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-500/30 rounded-md transition-all shadow-2xs hover:shadow active:scale-95 cursor-pointer"
                                  title="View Record"
                                >
                                  <FiEye size={11} className="stroke-[2.5]" />
                                </button>
                                {hasFullAccess && (
                                  <>
                                    <button
                                      onClick={() => handleEdit(client)}
                                      className="w-6 h-6 flex items-center justify-center bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 rounded-md transition-all shadow-2xs hover:shadow active:scale-95 cursor-pointer"
                                      title="Edit Record"
                                    >
                                      <FiEdit size={11} className="stroke-[2.5]" />
                                    </button>
                                    <button
                                      onClick={() => setClientToDelete(client)}
                                      className="w-6 h-6 flex items-center justify-center bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 rounded-md transition-all shadow-2xs hover:shadow active:scale-95 cursor-pointer"
                                      title="Delete Record"
                                    >
                                      <FiTrash2
                                        size={11}
                                        className="stroke-[2.5]"
                                      />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                        </motion.tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={
                          1 + // Client Name
                          1 + // Status
                          1 + // No. of Projects
                          2 + // Services & Deliverables
                          (canViewBudget ? 1 : 0) +
                          (user?.role === "team" && !isFinance && !isSocialMediaManager ? 1 : 0) +
                          1 // Actions
                        }
                        className="px-5 py-24 text-center"
                      >
                        <div className="flex flex-col items-center justify-center text-center">
                          <div className="w-14 h-14 rounded-full theme-bg-main flex items-center justify-center mb-3">
                            <FiUsers
                              className="text-blue-500 animate-pulse"
                              size={22}
                            />
                          </div>
                          <h2 className="text-[14px] font-extrabold theme-text-primary">
                            No Registered Clients Found
                          </h2>
                          <p className="text-[11px] theme-text-secondary mt-1 max-w-xs leading-relaxed">
                            Add a new client and configure budgets, services,
                            and commitment deliverables.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Premium Pagination Controls */}
          {totalItems > itemsPerPage && (
            <div className="px-5 py-4 border-t theme-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/20 dark:bg-[#111111]/10">
              {/* Left Side: Info */}
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Showing{" "}
                <span className="font-extrabold text-slate-700 dark:text-slate-350">
                  {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}
                </span>{" "}
                to{" "}
                <span className="font-extrabold text-slate-700 dark:text-slate-350">
                  {Math.min(currentPage * itemsPerPage, totalItems)}
                </span>{" "}
                of{" "}
                <span className="font-extrabold text-slate-700 dark:text-slate-350">
                  {totalItems}
                </span>{" "}
                clients
              </div>

              {/* Right Side: Page buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 rounded-lg border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-bold theme-text-primary disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-95 cursor-pointer"
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => {
                    const isSelected = page === currentPage;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`h-6 w-6 rounded-md text-[10px] font-extrabold flex items-center justify-center transition-all ${
                          isSelected
                            ? "theme-bg-accent text-white dark:text-black font-black"
                            : "bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  },
                )}

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 rounded-lg border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-bold theme-text-primary disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-95 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* CREATE & EDIT CLIENT MODAL */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowModal(false);
            }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 12 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="client-modal bg-white dark:bg-[#0f172a] w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-[#1e293b] flex flex-col"
            >
              {/* MODAL HEADER */}
              <div className="client-modal-header px-6 py-3.5 border-b border-slate-100 dark:border-[#1e293b] flex items-center justify-between bg-slate-50/80 dark:bg-[#0b1120] shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-xs">
                    <FiUsers size={17} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">
                      {editId ? "Update Client Details" : "Register New Client"}
                    </h2>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {editId
                        ? "Modify client profile, deliverables & commercial agreement"
                        : "Complete client onboarding details and contract scope"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="client-modal-btn-secondary w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 dark:bg-[#1e293b] dark:border-[#334155] flex items-center justify-center text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-all cursor-pointer shadow-xs active:scale-95"
                  title="Close (Esc)"
                >
                  <FiX size={15} />
                </button>
              </div>

              {/* COMPACT ELEGANT STEPPER TABS (NO HORIZONTAL OVERFLOW) */}
              <div className="client-modal-stepper-wrap px-6 py-2.5 border-b border-slate-100 dark:border-[#1e293b] bg-slate-50/50 dark:bg-[#0b1120] shrink-0">
                <div className={`client-modal-stepper-inner grid ${canViewBudget ? "grid-cols-4" : "grid-cols-3"} gap-1.5 p-1 bg-slate-100/80 dark:bg-[#131c31] rounded-xl border border-slate-200/50 dark:border-[#1e293b]`}>
                  {[
                    { id: "profile", label: "Company", step: 1, icon: FaRegBuilding },
                    { id: "branding", label: "Identity", step: 2, icon: FiTool },
                    { id: "service", label: "Services", step: 3, icon: FiLayers },
                    canViewBudget && { id: "finance", label: "Budget", step: 4, icon: FiDollarSign },
                  ].filter(Boolean).map((tab, idx) => {
                    const isActive = activeTab === tab.id;
                    const TabIcon = tab.icon;
                    const isCompleted =
                      (tab.id === "profile" && formData.companyName && formData.industry) ||
                      (tab.id === "branding" && formData.icon && formData.color) ||
                      (tab.id === "service" && Array.isArray(formData.service) && formData.service.length > 0) ||
                      (tab.id === "finance" && formData.budget);

                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer relative ${
                          isActive
                            ? "client-modal-tab-active bg-white dark:bg-[#1e293b] text-emerald-600 dark:text-emerald-400 shadow-xs font-bold border border-slate-200/70 dark:border-[#334155]"
                            : "client-modal-tab-inactive text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-[#1e293b]/50"
                        }`}
                      >
                        <span
                          className={`w-4.5 h-4.5 rounded-full text-[10px] flex items-center justify-center font-bold shrink-0 ${
                            isActive
                              ? "bg-emerald-500 text-white shadow-2xs"
                              : isCompleted
                                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                : "bg-slate-200/80 dark:bg-[#334155] text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {isCompleted && !isActive ? (
                            <FiCheck size={10} className="stroke-[3]" />
                          ) : (
                            idx + 1
                          )}
                        </span>
                        <TabIcon
                          size={12}
                          className={isActive ? "text-emerald-500 dark:text-emerald-400" : "opacity-60"}
                        />
                        <span className="truncate">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* MODAL FORM CONTAINER - FIXED UNIFORM HEIGHT ACROSS ALL TABS */}
              <form
                onSubmit={handleSubmit}
                className="flex-1 flex flex-col min-h-0 overflow-hidden"
              >
                <div className="client-modal-body h-[430px] max-h-[60vh] overflow-y-auto p-5 md:p-6 custom-scrollbar space-y-4 bg-white dark:bg-[#0f172a]">
                  <AnimatePresence mode="wait">
                    {/* TAB 1: COMPANY DETAILS */}
                    {activeTab === "profile" && (
                      <motion.div
                        key="profile"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-3.5"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          {/* Company Name */}
                          <div>
                            <div className="flex items-center justify-between mb-1 ml-1">
                              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                Company Name <span className="text-rose-500">*</span>
                              </label>
                              <span className="text-[10px] font-semibold text-rose-500">
                                Required
                              </span>
                            </div>
                            <div className="client-modal-input-wrap flex items-center w-full h-10 px-3.5 border border-slate-200 dark:border-[#334155] bg-slate-50/80 dark:bg-[#1e293b]/70 rounded-xl focus-within:bg-white dark:focus-within:bg-[#1e293b] focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 dark:focus-within:border-emerald-400 hover:border-slate-300 dark:hover:border-[#475569] transition-all duration-200 shadow-2xs group">
                              <FaRegBuilding
                                size={13}
                                className="text-slate-400 dark:text-slate-400 mr-2.5 shrink-0 group-focus-within:text-emerald-500 dark:group-focus-within:text-emerald-400 transition-colors"
                              />
                              <input
                                type="text"
                                name="companyName"
                                value={formData.companyName}
                                onChange={handleChange}
                                placeholder="Enter Client or Company Name"
                                className="w-full bg-transparent border-0 outline-none p-0 text-xs font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                required
                              />
                            </div>
                          </div>

                          {/* Industry Sector (Combobox) */}
                          <div>
                            <div className="flex items-center justify-between mb-1 ml-1">
                              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                Industry Sector <span className="text-rose-500">*</span>
                              </label>
                              <span className="text-[10px] font-semibold text-rose-500">
                                Required
                              </span>
                            </div>
                            <IndustryCombobox
                              value={formData.industry}
                              onChange={(val) =>
                                setFormData((prev) => ({ ...prev, industry: val }))
                              }
                              existingIndustries={uniqueIndustries}
                            />
                          </div>

                          {/* Onboarding Date */}
                          <div>
                            <div className="flex items-center justify-between mb-1 ml-1">
                              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                Onboarding Date <span className="text-rose-500">*</span>
                              </label>
                              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400">
                                Start Date
                              </span>
                            </div>
                            <div className="client-modal-input-wrap flex items-center w-full h-10 px-3.5 border border-slate-200 dark:border-[#334155] bg-slate-50/80 dark:bg-[#1e293b]/70 rounded-xl focus-within:bg-white dark:focus-within:bg-[#1e293b] focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 dark:focus-within:border-emerald-400 hover:border-slate-300 dark:hover:border-[#475569] transition-all duration-200 shadow-2xs group">
                              <FiCalendar
                                size={13}
                                className="text-slate-400 dark:text-slate-400 mr-2.5 shrink-0 group-focus-within:text-emerald-500 dark:group-focus-within:text-emerald-400 transition-colors"
                              />
                              <input
                                type="date"
                                name="onboardingDate"
                                value={formData.onboardingDate}
                                onChange={handleChange}
                                className="w-full bg-transparent border-0 outline-none p-0 text-xs font-semibold text-slate-800 dark:text-white cursor-pointer [color-scheme:dark]"
                                required
                              />
                            </div>
                          </div>

                          {/* Status */}
                          <div>
                            <div className="flex items-center justify-between mb-1 ml-1">
                              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                Status
                              </label>
                              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400">
                                Account State
                              </span>
                            </div>
                            <div className="client-modal-input-wrap flex items-center w-full h-10 px-3.5 border border-slate-200 dark:border-[#334155] bg-slate-50/80 dark:bg-[#1e293b]/70 rounded-xl focus-within:bg-white dark:focus-within:bg-[#1e293b] focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 dark:focus-within:border-emerald-400 hover:border-slate-300 dark:hover:border-[#475569] transition-all duration-200 shadow-2xs group relative">
                              <FiCheckCircle
                                size={13}
                                className="text-slate-400 dark:text-slate-400 mr-2.5 shrink-0 group-focus-within:text-emerald-500 dark:group-focus-within:text-emerald-400 transition-colors"
                              />
                              <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full bg-transparent border-0 outline-none p-0 text-xs font-semibold text-slate-800 dark:text-white cursor-pointer appearance-none [color-scheme:dark]"
                              >
                                <option value="Active" className="bg-[#1e293b] text-emerald-400 font-bold py-1">Active</option>
                                <option value="Inactive" className="bg-[#1e293b] text-rose-400 font-bold py-1">Inactive</option>
                              </select>
                              <div className="pointer-events-none text-slate-400 dark:text-slate-400 absolute right-3">
                                <FiChevronDown size={14} />
                              </div>
                            </div>
                          </div>

                          {/* Account Manager / SPOC */}
                          <div>
                            <div className="flex items-center justify-between mb-1 ml-1">
                              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                Account Manager / SPOC
                              </label>
                              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400">
                                Optional
                              </span>
                            </div>
                            <div className="client-modal-input-wrap flex items-center w-full h-10 px-3.5 border border-slate-200 dark:border-[#334155] bg-slate-50/80 dark:bg-[#1e293b]/70 rounded-xl focus-within:bg-white dark:focus-within:bg-[#1e293b] focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 dark:focus-within:border-emerald-400 hover:border-slate-300 dark:hover:border-[#475569] transition-all duration-200 shadow-2xs group">
                              <FiUser
                                size={13}
                                className="text-slate-400 dark:text-slate-400 mr-2.5 shrink-0 group-focus-within:text-emerald-500 dark:group-focus-within:text-emerald-400 transition-colors"
                              />
                              <input
                                type="text"
                                name="spoc"
                                value={formData.spoc}
                                onChange={handleChange}
                                placeholder="Representative Name (optional)"
                                className="w-full bg-transparent border-0 outline-none p-0 text-xs font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                              />
                            </div>
                          </div>

                          {/* Designation */}
                          <div>
                            <div className="flex items-center justify-between mb-1 ml-1">
                              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                Designation
                              </label>
                              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400">
                                Optional
                              </span>
                            </div>
                            <div className="client-modal-input-wrap flex items-center w-full h-10 px-3.5 border border-slate-200 dark:border-[#334155] bg-slate-50/80 dark:bg-[#1e293b]/70 rounded-xl focus-within:bg-white dark:focus-within:bg-[#1e293b] focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 dark:focus-within:border-emerald-400 hover:border-slate-300 dark:hover:border-[#475569] transition-all duration-200 shadow-2xs group">
                              <FiBriefcase
                                size={13}
                                className="text-slate-400 dark:text-slate-400 mr-2.5 shrink-0 group-focus-within:text-emerald-500 dark:group-focus-within:text-emerald-400 transition-colors"
                              />
                              <input
                                type="text"
                                name="designation"
                                value={formData.designation}
                                onChange={handleChange}
                                placeholder="e.g. Marketing Manager (optional)"
                                className="w-full bg-transparent border-0 outline-none p-0 text-xs font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                              />
                            </div>
                          </div>

                          {/* Phone Number */}
                          <div className="md:col-span-2">
                            <div className="flex items-center justify-between mb-1 ml-1">
                              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                Phone Number
                              </label>
                              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400">
                                Optional
                              </span>
                            </div>
                            <div className="client-modal-input-wrap flex items-center w-full h-10 px-3.5 border border-slate-200 dark:border-[#334155] bg-slate-50/80 dark:bg-[#1e293b]/70 rounded-xl focus-within:bg-white dark:focus-within:bg-[#1e293b] focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 dark:focus-within:border-emerald-400 hover:border-slate-300 dark:hover:border-[#475569] transition-all duration-200 shadow-2xs group">
                              <FiPhone
                                size={13}
                                className="text-slate-400 dark:text-slate-400 mr-2.5 shrink-0 group-focus-within:text-emerald-500 dark:group-focus-within:text-emerald-400 transition-colors"
                              />
                              <input
                                type="tel"
                                maxLength={15}
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                placeholder="Enter Phone Number (optional)"
                                className="w-full bg-transparent border-0 outline-none p-0 text-xs font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* TAB 2: BRAND IDENTITY */}
                    {activeTab === "branding" && (
                      <motion.div
                        key="branding"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-4"
                      >
                        {/* Live Brand Preview Card */}
                        <div className="client-modal-card bg-slate-50/80 dark:bg-[#131c31] p-3.5 rounded-xl border border-slate-200/80 dark:border-[#1e293b] flex items-center justify-between shadow-2xs">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm transition-all duration-300 shrink-0"
                              style={{ backgroundColor: formData.color }}
                            >
                              {React.createElement(
                                CLIENT_ICONS[formData.icon] || FaRegBuilding,
                                { size: 18, className: "drop-shadow-sm" }
                              )}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-800 dark:text-white leading-tight">
                                {formData.companyName || "Client Brand Name"}
                              </div>
                              <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-400">
                                {formData.industry || "Industry Sector"}
                              </div>
                            </div>
                          </div>

                          <div
                            className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shadow-2xs tracking-wider"
                            style={{
                              backgroundColor: `${formData.color}15`,
                              borderColor: `${formData.color}40`,
                              color: formData.color,
                            }}
                          >
                            Live Preview
                          </div>
                        </div>

                        {/* Icon Selection */}
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <FiBriefcase size={11} className="text-slate-400" />
                            Brand Identity Icon
                          </label>
                          <div className="client-modal-card grid grid-cols-5 sm:grid-cols-10 gap-2 bg-slate-50/80 dark:bg-[#131c31] p-3 rounded-xl border border-slate-200/60 dark:border-[#1e293b] shadow-2xs">
                            {Object.entries(CLIENT_ICONS).map(
                              ([key, IconComponent]) => {
                                const isSelected = formData.icon === key;
                                return (
                                  <button
                                    key={key}
                                    type="button"
                                    onClick={() =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        icon: key,
                                      }))
                                    }
                                    className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center transition-all duration-150 cursor-pointer ${
                                      isSelected
                                        ? "shadow-sm scale-105 ring-2 ring-offset-2 dark:ring-offset-[#0f172a] bg-white dark:bg-[#1e293b]"
                                        : "hover:scale-105 hover:bg-white dark:hover:bg-[#1e293b]/70"
                                    }`}
                                    style={{
                                      color: isSelected
                                        ? formData.color
                                        : "rgb(148, 163, 184)",
                                      ringColor: isSelected
                                        ? formData.color
                                        : "transparent",
                                    }}
                                    title={key
                                      .replace("Fa", "")
                                      .replace("Fi", "")}
                                  >
                                    <IconComponent size={16} />
                                  </button>
                                );
                              }
                            )}
                          </div>
                        </div>

                        {/* Color Selection */}
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            Brand Theme Color
                          </label>
                          <div className="client-modal-card flex flex-wrap items-center gap-2 bg-slate-50/80 dark:bg-[#131c31] p-3 rounded-xl border border-slate-200/60 dark:border-[#1e293b] shadow-2xs">
                            {CLIENT_COLORS.map((colorItem) => {
                              const c = colorItem.value || colorItem;
                              const isSelected = formData.color === c;
                              return (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      color: c,
                                    }))
                                  }
                                  className={`w-7 h-7 rounded-full transition-all duration-150 cursor-pointer flex items-center justify-center ${
                                    isSelected
                                      ? "scale-110 shadow-sm ring-2 ring-offset-2 dark:ring-offset-[#0f172a]"
                                      : "hover:scale-110"
                                  }`}
                                  style={{
                                    backgroundColor: c,
                                    ringColor: isSelected ? c : "transparent",
                                  }}
                                >
                                  {isSelected && (
                                    <FiCheck
                                      size={12}
                                      className="text-white drop-shadow-sm stroke-[3]"
                                    />
                                  )}
                                </button>
                              );
                            })}

                            <div className="w-px h-6 bg-slate-200 dark:bg-[#334155] mx-1" />

                            <label
                              className={`relative h-7 px-2.5 rounded-lg border bg-white dark:bg-[#1e293b] cursor-pointer flex items-center justify-center shadow-2xs transition-all ${
                                !CLIENT_COLORS.some(
                                  (colorItem) =>
                                    (colorItem.value || colorItem) ===
                                    formData.color
                                )
                                  ? "border-solid shadow-sm ring-2 ring-offset-2 dark:ring-offset-[#0f172a] scale-105 border-emerald-500"
                                  : "border-slate-300 dark:border-[#334155] hover:scale-105"
                              }`}
                              style={{
                                borderColor: !CLIENT_COLORS.some(
                                  (colorItem) =>
                                    (colorItem.value || colorItem) ===
                                    formData.color
                                )
                                  ? formData.color
                                  : undefined,
                              }}
                            >
                              <div className="flex items-center gap-1.5">
                                <div
                                  className="w-3 h-3 rounded-full border border-black/10 dark:border-white/10"
                                  style={{ backgroundColor: formData.color }}
                                />
                                <span className="text-[9.5px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                  Custom
                                </span>
                              </div>
                              <input
                                type="color"
                                name="color"
                                value={formData.color}
                                onChange={handleChange}
                                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                              />
                            </label>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* TAB 3: SERVICE CATEGORIES & COMMITMENTS */}
                    {activeTab === "service" && (
                      <motion.div
                        key="service"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-3.5"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          <MultiSelect
                            label="Core Contract Service"
                            placeholder="Select Service Areas"
                            options={[
                              {
                                value: "Digital Marketing",
                                label: "Digital Marketing",
                              },
                              { value: "Website", label: "Website Development" },
                              { value: "SEO", label: "SEO Strategy" },
                              {
                                value: "Additional work",
                                label: "Additional work",
                              },
                              {
                                value: "Video Production",
                                label: "Video Production",
                              },
                              { value: "Others", label: "Others" },
                            ]}
                            selectedValues={formData.service || []}
                            onChange={handleServiceChange}
                            icon={FiLayers}
                          />

                          <MultiSelect
                            label="Assign to members"
                            placeholder="Select members"
                            options={allUsers.map((u) => ({
                              value: u._id,
                              label: u.name,
                              subLabel: u.email,
                              avatarUrl:
                                u.profile?.profileImage?.url ||
                                u.profileImage?.url ||
                                u.profile?.avatar ||
                                u.avatar ||
                                "",
                              group: u.department
                                ? u.department.toUpperCase()
                                : "UNASSIGNED",
                            }))}
                            selectedValues={formData.assignedTo || []}
                            onChange={handleAssignedChange}
                            icon={FiUsers}
                          />
                        </div>

                        {/* Commitments Dynamic Blocks */}
                        {formData.service &&
                          (Array.isArray(formData.service)
                            ? formData.service.length > 0
                            : formData.service) && (
                            <div className="pt-1 space-y-3">
                              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <FiBookOpen size={11} />
                                Deliverables Setup
                              </label>

                              {/* Digital Marketing commitments */}
                              {((Array.isArray(formData.service) &&
                                formData.service.includes("Digital Marketing")) ||
                                formData.service === "Digital Marketing") && (
                                <div className="client-modal-card bg-slate-50/80 dark:bg-[#131c31] border border-slate-200/80 dark:border-[#1e293b] rounded-xl p-3.5 space-y-3 shadow-2xs">
                                  <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                                    <FiLayers size={13} /> Digital Marketing Deliverables
                                  </h4>
                                  <div className="grid grid-cols-3 gap-2.5">
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                        Reels
                                      </label>
                                      <input
                                        type="number"
                                        name="reels"
                                        value={formData.reels}
                                        onChange={handleChange}
                                        placeholder="Count"
                                        className="w-full h-9 rounded-lg border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1e293b] px-3 text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 font-semibold placeholder:text-slate-400 dark:placeholder:text-slate-500 [color-scheme:dark]"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                        Posts
                                      </label>
                                      <input
                                        type="number"
                                        name="posts"
                                        value={formData.posts}
                                        onChange={handleChange}
                                        placeholder="Count"
                                        className="w-full h-9 rounded-lg border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1e293b] px-3 text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 font-semibold placeholder:text-slate-400 dark:placeholder:text-slate-500 [color-scheme:dark]"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                        Story
                                      </label>
                                      <input
                                        type="number"
                                        name="story"
                                        value={formData.story}
                                        onChange={handleChange}
                                        placeholder="Count"
                                        className="w-full h-9 rounded-lg border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1e293b] px-3 text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 font-semibold placeholder:text-slate-400 dark:placeholder:text-slate-500 [color-scheme:dark]"
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                      DSLR requirement
                                    </label>
                                    <select
                                      name="needDslr"
                                      value={formData.needDslr}
                                      onChange={handleChange}
                                      className="h-9 px-3 rounded-lg border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1e293b] text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold cursor-pointer w-full md:w-52 appearance-none [color-scheme:dark]"
                                    >
                                      <option value="" className="bg-[#1e293b] text-slate-200">Select Option</option>
                                      <option value="Need DSLR" className="bg-[#1e293b] text-slate-200">Need DSLR</option>
                                      <option value="No DSLR" className="bg-[#1e293b] text-slate-200">No DSLR</option>
                                    </select>
                                  </div>
                                </div>
                              )}

                              {/* Website commitments */}
                              {((Array.isArray(formData.service) &&
                                formData.service.includes("Website")) ||
                                formData.service === "Website") && (
                                <div className="client-modal-card bg-slate-50/80 dark:bg-[#131c31] border border-slate-200/80 dark:border-[#1e293b] rounded-xl p-3.5 shadow-2xs">
                                  <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-2">
                                    <FiGlobe size={13} /> Website Deliverables
                                  </h4>
                                  <div className="w-full md:w-1/2">
                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                      Estimated Web Pages
                                    </label>
                                    <input
                                      type="number"
                                      name="pages"
                                      value={formData.pages}
                                      onChange={handleChange}
                                      placeholder="e.g. 5 Pages"
                                      className="w-full h-9 rounded-lg border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1e293b] px-3 text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 font-semibold placeholder:text-slate-400 dark:placeholder:text-slate-500 [color-scheme:dark]"
                                    />
                                  </div>
                                </div>
                              )}

                              {/* SEO commitments */}
                              {((Array.isArray(formData.service) &&
                                formData.service.includes("SEO")) ||
                                formData.service === "SEO") && (
                                <div className="client-modal-card bg-slate-50/80 dark:bg-[#131c31] border border-slate-200/80 dark:border-[#1e293b] rounded-xl p-3.5 shadow-2xs">
                                  <h4 className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5 mb-2">
                                    <FiSearch size={13} /> SEO Deliverables
                                  </h4>
                                  <div className="flex flex-wrap gap-2.5">
                                    <label className="flex items-center gap-2 bg-white dark:bg-[#1e293b] px-3 py-2 rounded-lg border border-slate-200 dark:border-[#334155] text-xs text-slate-700 dark:text-slate-200 cursor-pointer font-semibold">
                                      <input
                                        type="checkbox"
                                        name="onpage"
                                        checked={formData.onpage}
                                        onChange={handleChange}
                                        className="rounded text-purple-600 focus:ring-purple-500"
                                      />
                                      On-Page SEO
                                    </label>

                                    <label className="flex items-center gap-2 bg-white dark:bg-[#1e293b] px-3 py-2 rounded-lg border border-slate-200 dark:border-[#334155] text-xs text-slate-700 dark:text-slate-200 cursor-pointer font-semibold">
                                      <input
                                        type="checkbox"
                                        name="offpage"
                                        checked={formData.offpage}
                                        onChange={handleChange}
                                        className="rounded text-purple-600 focus:ring-purple-500"
                                      />
                                      Off-Page Link Building
                                    </label>
                                  </div>
                                </div>
                              )}

                              {/* Video Production commitments */}
                              {((Array.isArray(formData.service) &&
                                formData.service.includes("Video Production")) ||
                                formData.service === "Video Production") && (
                                <div className="client-modal-card bg-slate-50/80 dark:bg-[#131c31] border border-slate-200/80 dark:border-[#1e293b] rounded-xl p-3.5 space-y-3 shadow-2xs">
                                  <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                                    <FiVideo size={13} /> Video Production Deliverables
                                  </h4>
                                  <div className="grid grid-cols-2 gap-2.5">
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                        Story Count
                                      </label>
                                      <input
                                        type="number"
                                        name="story"
                                        value={formData.story}
                                        onChange={handleChange}
                                        placeholder="Count"
                                        className="w-full h-9 rounded-lg border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1e293b] px-3 text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-rose-500/20 font-semibold placeholder:text-slate-400 dark:placeholder:text-slate-500 [color-scheme:dark]"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                        Reels Count
                                      </label>
                                      <input
                                        type="number"
                                        name="reels"
                                        value={formData.reels}
                                        onChange={handleChange}
                                        placeholder="Count"
                                        className="w-full h-9 rounded-lg border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1e293b] px-3 text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-rose-500/20 font-semibold placeholder:text-slate-400 dark:placeholder:text-slate-500 [color-scheme:dark]"
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                      DSLR requirement
                                    </label>
                                    <select
                                      name="needDslr"
                                      value={formData.needDslr}
                                      onChange={handleChange}
                                      className="h-9 px-3 rounded-lg border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1e293b] text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-rose-500/20 font-semibold cursor-pointer w-full md:w-52 appearance-none [color-scheme:dark]"
                                    >
                                      <option value="" className="bg-[#1e293b] text-slate-200">Select Option</option>
                                      <option value="Need DSLR" className="bg-[#1e293b] text-slate-200">Need DSLR</option>
                                      <option value="No DSLR" className="bg-[#1e293b] text-slate-200">No DSLR</option>
                                    </select>
                                  </div>
                                </div>
                              )}

                              {/* Additional work commitments */}
                              {((Array.isArray(formData.service) &&
                                formData.service.includes("Additional work")) ||
                                formData.service === "Additional work") && (
                                <div className="client-modal-card bg-slate-50/80 dark:bg-[#131c31] border border-slate-200/80 dark:border-[#1e293b] rounded-xl p-3 shadow-2xs">
                                  <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mb-1">
                                    <FiPlusCircle size={13} /> Additional Work Details
                                  </h4>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                                    Additional deliverables and project-specific tasks can be
                                    added directly via project boards or milestone notes.
                                  </p>
                                </div>
                              )}

                              {/* Others commitments */}
                              {((Array.isArray(formData.service) &&
                                formData.service.includes("Others")) ||
                                formData.service === "Others") && (
                                <div className="client-modal-card bg-slate-50/80 dark:bg-[#131c31] border border-slate-200/80 dark:border-[#1e293b] rounded-xl p-3 shadow-2xs">
                                  <h4 className="text-xs font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1.5 mb-1">
                                    <FiHelpCircle size={13} /> Custom Service Deliverables
                                  </h4>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                                    Configure specific milestones and guidelines directly with
                                    the assigned team members.
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                      </motion.div>
                    )}

                    {/* TAB 4: FINANCIALS & GST SETUP */}
                    {canViewBudget && activeTab === "finance" && (
                      <motion.div
                        key="finance"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-3.5"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                              <FiDollarSign size={11} className="text-slate-400" />
                              Base Budget (INR)
                            </label>
                            <input
                              type="number"
                              name="budget"
                              value={formData.budget}
                              onChange={handleChange}
                              placeholder="e.g. 50000"
                              className="w-full h-10 rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1e293b] px-3 text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 font-semibold placeholder:text-slate-400 dark:placeholder:text-slate-500 [color-scheme:dark]"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                              <FiPercent size={11} className="text-slate-400" />
                              GST Slab (%)
                            </label>
                            <input
                              type="number"
                              name="gst"
                              value={formData.gst}
                              onChange={handleChange}
                              placeholder="e.g. 18"
                              className="w-full h-10 rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1e293b] px-3 text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 font-semibold placeholder:text-slate-400 dark:placeholder:text-slate-500 [color-scheme:dark]"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                              Grand Total (Inc. GST)
                            </label>
                            <div className="w-full h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50 px-3 flex items-center text-emerald-600 dark:text-emerald-400 font-extrabold text-xs">
                              ₹{Number(calculateTotal()).toLocaleString("en-IN")}
                            </div>
                          </div>
                        </div>

                        {/* Summary Card Before Submission */}
                        <div className="client-modal-card bg-slate-50/80 dark:bg-[#131c31] rounded-xl p-3.5 border border-slate-200/80 dark:border-[#1e293b] mt-2 space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                            Summary Confirmation
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            <div>
                              <div className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">Client</div>
                              <div className="font-bold text-slate-800 dark:text-white truncate">
                                {formData.companyName || "—"}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">Industry</div>
                              <div className="font-bold text-slate-800 dark:text-white truncate">
                                {formData.industry || "—"}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">Services</div>
                              <div className="font-bold text-slate-800 dark:text-white truncate">
                                {Array.isArray(formData.service) && formData.service.length > 0
                                  ? formData.service.join(", ")
                                  : "None"}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">Status</div>
                              <div className="font-bold text-slate-800 dark:text-white">
                                {formData.status || "Active"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* STICKY ACTION FOOTER */}
                <div className="client-modal-footer px-6 py-3.5 border-t border-slate-100 dark:border-[#1e293b] bg-slate-50/80 dark:bg-[#0b1120] backdrop-blur-sm flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    {activeTab !== "profile" ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (activeTab === "finance") setActiveTab("service");
                          else if (activeTab === "service") setActiveTab("branding");
                          else if (activeTab === "branding") setActiveTab("profile");
                        }}
                        className="client-modal-btn-secondary flex items-center gap-1 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1e293b] text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#334155] font-semibold transition-all text-xs cursor-pointer shadow-2xs active:scale-95"
                      >
                        <FiChevronLeft size={13} />
                        Back
                      </button>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 px-1">
                        {`Step 1 of ${canViewBudget ? "4" : "3"}: Company Profile`}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="client-modal-btn-secondary px-4 py-2 rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1e293b] text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#334155] font-semibold transition-all text-xs cursor-pointer shadow-2xs active:scale-95"
                    >
                      Cancel
                    </button>

                    {activeTab !== (canViewBudget ? "finance" : "service") ? (
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="flex items-center gap-1.5 px-5 py-2 rounded-xl font-bold text-xs cursor-pointer shadow-md hover:shadow-lg transition-all active:scale-95 text-white bg-emerald-600 hover:bg-emerald-500"
                      >
                        <span>
                          {activeTab === "profile"
                            ? "Next: Brand Identity"
                            : activeTab === "branding"
                              ? "Next: Service Plan"
                              : "Next: Budget"}
                        </span>
                        <FiChevronRight size={13} />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 px-5 py-2 rounded-xl font-bold text-xs cursor-pointer shadow-md hover:shadow-xl transition-all hover:scale-[1.02] active:scale-95 text-white bg-emerald-600 hover:bg-emerald-500"
                      >
                        <FiCheck size={14} />
                        <span>{editId ? "Update Client" : "Register Client"}</span>
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONFIRM DELETE WARNING POPUP */}
      <AnimatePresence>
        {clientToDelete && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl p-5 border border-rose-100/50 dark:border-rose-950/20 text-slate-850 dark:text-slate-200"
            >
              <h2 className="text-[15px] font-black text-rose-600 dark:text-rose-405 flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <FiAlertTriangle size={15} />
                </span>
                Confirm Client Deletion
              </h2>

              <p className="text-xs text-slate-600 dark:text-slate-350 mt-3 leading-relaxed font-semibold">
                Are you sure you want to permanently delete the client record
                for{" "}
                <span className="text-rose-600 dark:text-rose-400 font-extrabold inline-flex items-center gap-1 mx-1 translate-y-0.5">
                  <FaRegBuilding size={11} />"{clientToDelete.companyName}"
                </span>
                ?
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 leading-relaxed font-medium">
                This will purge all commitment details, taxation configurations,
                and related project assignments from the system. This operation
                is irreversible.
              </p>

              {/* POPUP BUTTON ACTIONS */}
              <div className="flex justify-end gap-2 mt-5">
                <button
                  type="button"
                  onClick={() => setClientToDelete(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-500 dark:text-slate-400 font-bold transition-all text-xs cursor-pointer"
                >
                  No, Keep Record
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await dispatch(deleteClient(clientToDelete._id));
                    setClientToDelete(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 text-white font-bold shadow-md hover:scale-[1.01] transition-all text-xs cursor-pointer"
                >
                  Yes, Purge Client
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VIEW CLIENT OFFCANVAS */}
      <AnimatePresence>
        {showViewOffcanvas && viewClient && (
          <React.Fragment>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowViewOffcanvas(false)}
              className="fixed inset-0 z-40 bg-black/40"
            />
            {/* Offcanvas Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-50 w-full md:w-[800px] lg:w-[1000px] bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col"
            >
              {/* Header Top */}
              <div className="px-4.5 py-3 flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowViewOffcanvas(false)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                  >
                    <FiArrowLeft size={14} />
                  </button>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                      {viewClient.companyName}
                    </h2>
                    {viewClient.status === "Inactive" ? (
                      <span className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 font-bold text-[9px] border border-rose-200 dark:border-rose-800/60">
                        Inactive
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-bold text-[9px] border border-emerald-200 dark:border-emerald-800/60">
                        Active
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowViewOffcanvas(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-200 dark:hover:border-rose-800 transition-colors"
                >
                  <FiX size={14} />
                </button>
              </div>

              {/* Tabs */}
              <div className="px-4.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
                  {["Overview", "Authentication & Verification"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setViewOffcanvasTab(tab)}
                      className={`py-2 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                        viewOffcanvasTab === tab
                          ? "border-emerald-500 text-slate-800 dark:text-slate-100"
                          : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 sidebar-bg">
                {viewOffcanvasTab === "Overview" &&
                  (() => {
                    // Calculate Stats
                    const clientProjects = projects.filter((p) => {
                      const cId = p.client?._id || p.client;
                      return cId === viewClient._id;
                    });

                    const clientTasks = tasks.filter((t) => {
                      const cId =
                        t.client?._id ||
                        t.client ||
                        t.project?.client?._id ||
                        t.project?.client;
                      return cId === viewClient._id;
                    });

                    const totalTasks = clientTasks.length;
                    const inProgressTasks = clientTasks.filter(
                      (t) =>
                        t.status === "In Progress" ||
                        t.status === "Not Started",
                    ).length;
                    const completedTasks = clientTasks.filter(
                      (t) => t.status === "Completed",
                    ).length;
                    const overdueTasks = clientTasks.filter((t) => {
                      if (t.status === "Completed") return false;
                      return (
                        t.status === "Overdue" ||
                        (t.dueDate && new Date(t.dueDate) < new Date())
                      );
                    }).length;



                    return (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full">
                        {/* Left Column */}
                        <div className="lg:col-span-7 xl:col-span-7 space-y-4">
                          {/* Section 1: Client Profile (Compact & Clean Grid UX) */}
                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                            {/* Header */}
                            <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100 dark:border-slate-800">
                              <div className="flex items-center gap-2.5">
                                {(() => {
                                  const ClientIcon = getClientIconComponent(
                                    viewClient.icon,
                                  );
                                  return (
                                    <div
                                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border shadow-2xs"
                                      style={{
                                        backgroundColor: `${viewClient.color || "#3b82f6"}15`,
                                        borderColor: `${viewClient.color || "#3b82f6"}30`,
                                        color: viewClient.color || "#3b82f6",
                                      }}
                                    >
                                      <ClientIcon size={13} />
                                    </div>
                                  );
                                })()}
                                <h3 className="text-[12px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                                  Client Profile
                                </h3>
                              </div>

                              {/* Status Badge */}
                              {viewClient.status === "Inactive" ? (
                                <span className="px-2.5 py-0.5 rounded-full text-rose-700 dark:text-rose-400 font-extrabold text-[10.5px] bg-rose-100/80 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50">
                                  Inactive
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-emerald-700 dark:text-emerald-400 font-extrabold text-[10.5px] bg-emerald-100/80 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/50">
                                  Active
                                </span>
                              )}
                            </div>

                            {/* Profile Fields Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                              {/* Company Name */}
                              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                                  Company Name
                                </span>
                                <span
                                  className="font-bold text-slate-800 dark:text-slate-100 truncate block text-xs"
                                  title={viewClient.companyName}
                                >
                                  {viewClient.companyName}
                                </span>
                              </div>

                              {/* Industry */}
                              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                                  Industry
                                </span>
                                <span className="font-bold text-slate-800 dark:text-slate-100 truncate block text-xs">
                                  {viewClient.industry || "-"}
                                </span>
                              </div>

                              {/* Account Manager */}
                              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                                  Account Manager
                                </span>
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <div className="w-4.5 h-4.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-[8.5px] shrink-0">
                                    {viewClient.spoc
                                      ? viewClient.spoc.charAt(0).toUpperCase()
                                      : "-"}
                                  </div>
                                  <span
                                    className="font-bold text-slate-800 dark:text-slate-100 truncate text-xs"
                                    title={viewClient.spoc || "-"}
                                  >
                                    {viewClient.spoc || "-"}
                                  </span>
                                </div>
                              </div>

                              {/* Phone */}
                              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                                  Phone
                                </span>
                                <span className="font-bold text-slate-800 dark:text-slate-100 truncate block text-xs">
                                  {viewClient.phoneNumber || "-"}
                                </span>
                              </div>

                              {/* Onboard Date */}
                              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                                  Onboard Date
                                </span>
                                <span className="font-bold text-slate-800 dark:text-slate-100 truncate block text-xs">
                                  {viewClient.onboardingDate
                                    ? new Date(
                                        viewClient.onboardingDate,
                                      ).toLocaleDateString("en-GB", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                      })
                                    : "-"}
                                </span>
                              </div>

                              {/* Designation */}
                              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                                  Designation
                                </span>
                                <span className="font-bold text-slate-800 dark:text-slate-100 truncate block text-xs">
                                  {viewClient.designation ||
                                    viewClient.contactPerson ||
                                    "-"}
                                </span>
                              </div>
                            </div>

                            {/* Financial Fields (Role-Based for Admin / OM / Finance) */}
                            {canViewBudget && (
                              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2.5 text-xs">
                                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                                  <span className="text-[9.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-0.5">
                                    Base Budget
                                  </span>
                                  <span className="font-bold text-slate-800 dark:text-slate-100">
                                    ₹
                                    {(viewClient.budget || 0).toLocaleString(
                                      "en-IN",
                                    )}
                                  </span>
                                </div>

                                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                                  <span className="text-[9.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-0.5">
                                    GST Slab
                                  </span>
                                  <span className="font-bold text-slate-800 dark:text-slate-100">
                                    {viewClient.gst || 18}%
                                  </span>
                                </div>

                                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/50">
                                  <span className="text-[9.5px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block mb-0.5">
                                    Grand Total
                                  </span>
                                  <span className="font-black text-emerald-600 dark:text-emerald-400">
                                    ₹
                                    {(
                                      viewClient.totalBudget ||
                                      viewClient.budget ||
                                      0
                                    ).toLocaleString("en-IN")}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>


                        </div>

                        {/* Right Column */}
                        <div className="lg:col-span-5 xl:col-span-5 space-y-4 w-full">
                          {/* Section 2: Projects Card */}
                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm w-full">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-[12px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                                Projects ({clientProjects.length})
                              </h3>
                              <Link to={`/${user.role}/projects`}>
                                <span className="text-[10.5px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer">
                                  View All
                                </span>
                              </Link>
                            </div>

                            <div className="space-y-2">
                              {clientProjects.slice(0, 5).map((project) => (
                                <Link
                                  key={project._id}
                                  to={`/${user.role}/projects?id=${project._id}`}
                                  className="block"
                                >
                                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/30 transition-colors hover:bg-blue-50/80 dark:hover:bg-blue-950/20 hover:border-blue-200/50 dark:hover:border-blue-800/50 cursor-pointer group">
                                    <div className="flex items-center gap-2.5">
                                      <div
                                        className="w-6.5 h-6.5 rounded-lg flex items-center justify-center text-white shadow-sm"
                                        style={{
                                          background:
                                            project.color ||
                                            "var(--accent-gradient)",
                                        }}
                                      >
                                        <FiBriefcase size={12} />
                                      </div>
                                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {project.name}
                                      </span>
                                    </div>
                                    <span className="px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                                      {project.status || "Active"}
                                    </span>
                                  </div>
                                </Link>
                              ))}
                              {clientProjects.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-4 text-slate-400">
                                  <FiBriefcase
                                    size={20}
                                    className="mb-1.5 opacity-30"
                                  />
                                  <span className="text-[11px] font-bold">
                                    No projects assigned yet.
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Section 3: Tasks Summary Card */}
                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm w-full">
                            <h3 className="text-[12px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">
                              Tasks Summary
                            </h3>
                            <div className="grid grid-cols-2 gap-2.5">
                              {/* Total */}
                              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
                                <span className="text-xl font-black text-blue-700 dark:text-blue-400 mb-0.5">
                                  {totalTasks}
                                </span>
                                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-center">
                                  Total
                                </span>
                              </div>
                              {/* In Progress */}
                              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
                                <span className="text-xl font-black text-amber-600 dark:text-amber-400 mb-0.5">
                                  {inProgressTasks}
                                </span>
                                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-center">
                                  Active
                                </span>
                              </div>
                              {/* Completed */}
                              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mb-0.5">
                                  {completedTasks}
                                </span>
                                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-center">
                                  Done
                                </span>
                              </div>
                              {/* Overdue */}
                              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
                                <span className="text-xl font-black text-rose-600 dark:text-rose-400 mb-0.5">
                                  {overdueTasks}
                                </span>
                                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-center">
                                  Overdue
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                {viewOffcanvasTab === "Authentication & Verification" && (
                  <div className="w-full flex flex-col xl:flex-row gap-5">
                    {/* Main Content: Methods List */}
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-md bg-purple-100 text-purple-600 flex items-center justify-center">
                              <FiCheckCircle size={14} />
                            </span>
                            Authentication & Verification
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Manage multi-factor authentication and verification
                            methods for this client.
                          </p>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase tracking-wider font-extrabold text-slate-500 dark:text-slate-400">
                              <th className="px-4 py-3 w-[240px]">Method</th>
                              <th className="px-4 py-3 w-full">
                                Configuration
                              </th>
                              <th className="px-4 py-3 text-center w-[180px]">
                                Status
                              </th>
                              <th className="px-4 py-3 text-center w-[90px]">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {predefinedAuthMethods.map((predef, idx) => {
                              const currentData =
                                (viewClient?.authMethods || []).find(
                                  (m) => m.method === predef.method,
                                ) || predef;
                              const isEditingThisRow = editingRowIndex === idx;

                              let icon = (
                                <FiCheckCircle
                                  size={14}
                                  className="text-slate-600"
                                />
                              );
                              let iconBg = "bg-slate-100";
                              let subtitle = predef.subtitle;
                              if (predef.method === "Email OTP") {
                                icon = (
                                  <FiMail
                                    size={14}
                                    className="text-purple-600"
                                  />
                                );
                                iconBg = "bg-purple-100";
                              } else if (predef.method === "WhatsApp OTP") {
                                icon = (
                                  <FiPhone
                                    size={14}
                                    className="text-emerald-600"
                                  />
                                );
                                iconBg = "bg-emerald-100";
                              } else if (
                                predef.method === "Two-Factor Authentication"
                              ) {
                                icon = (
                                  <FiCheckCircle
                                    size={14}
                                    className="text-blue-600"
                                  />
                                );
                                iconBg = "bg-blue-100";
                              } else if (
                                predef.method === "SMS / Message OTP"
                              ) {
                                icon = (
                                  <FiMessageSquare
                                    size={14}
                                    className="text-blue-600"
                                  />
                                );
                                iconBg = "bg-blue-100";
                              } else if (predef.method === "Voice Call OTP") {
                                icon = (
                                  <FiPhoneCall
                                    size={14}
                                    className="text-orange-600"
                                  />
                                );
                                iconBg = "bg-orange-100";
                              } else if (
                                predef.method === "Authenticator App"
                              ) {
                                icon = (
                                  <FiLock
                                    size={14}
                                    className="text-purple-600"
                                  />
                                );
                                iconBg = "bg-purple-100";
                              } else if (
                                predef.method === "Selfie Verification"
                              ) {
                                icon = (
                                  <FiCamera
                                    size={14}
                                    className="text-slate-600"
                                  />
                                );
                                iconBg = "bg-slate-100";
                              } else if (predef.method === "Backup Codes") {
                                icon = (
                                  <FiTool
                                    size={14}
                                    className="text-emerald-600"
                                  />
                                );
                                iconBg = "bg-emerald-100";
                              }

                              return (
                                <tr
                                  key={idx}
                                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                                >
                                  <td className="px-4 py-3 align-middle">
                                    <div className="flex items-center gap-3">
                                      <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}
                                      >
                                        {icon}
                                      </div>
                                      <div>
                                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                          {predef.method}
                                        </div>
                                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                          {subtitle}
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  <td className="px-4 py-3 align-middle text-xs text-slate-600 dark:text-slate-300 font-medium">
                                    {isEditingThisRow ? (
                                      <input
                                        type="text"
                                        value={editRowData.config}
                                        onChange={(e) =>
                                          setEditRowData({
                                            ...editRowData,
                                            config: e.target.value,
                                          })
                                        }
                                        placeholder="Enter configuration..."
                                        className="w-full py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                                      />
                                    ) : (
                                      currentData.config || (
                                        <span className="text-slate-400 italic">
                                          {currentData.status ===
                                            "Configured" ||
                                          currentData.status === "Enabled"
                                            ? "Enabled"
                                            : "Not configured"}
                                        </span>
                                      )
                                    )}
                                  </td>

                                  <td className="px-4 py-3 align-middle text-center">
                                    {isEditingThisRow ? (
                                      <select
                                        value={editRowData.status}
                                        onChange={(e) =>
                                          setEditRowData({
                                            ...editRowData,
                                            status: e.target.value,
                                          })
                                        }
                                        className="w-full min-w-[130px] py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                                      >
                                        <option value="Enabled">Enabled</option>
                                        <option value="Configured">
                                          Configured
                                        </option>
                                        <option value="Not Configured">
                                          Not Configured
                                        </option>
                                        <option value="Disabled">
                                          Disabled
                                        </option>
                                      </select>
                                    ) : (
                                      <span
                                        className={`inline-flex items-center justify-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                          currentData.status === "Enabled"
                                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                            : currentData.status ===
                                                "Configured"
                                              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                              : currentData.status ===
                                                  "Disabled"
                                                ? "bg-rose-50 text-rose-600 border border-rose-200"
                                                : "bg-orange-50 text-orange-600 border border-orange-200"
                                        }`}
                                      >
                                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                        {currentData.status ||
                                          predef.defaultStatus}
                                      </span>
                                    )}
                                  </td>

                                  <td className="px-4 py-3 align-middle text-center w-[120px]">
                                    {isEditingThisRow ? (
                                      <div className="flex items-center justify-center gap-2">
                                        <button
                                          onClick={handleCancelEditRow}
                                          className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-colors border border-rose-200 shadow-sm"
                                        >
                                          <FiX size={12} strokeWidth={3} />
                                        </button>
                                        <button
                                          onClick={handleSaveRow}
                                          className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors border border-emerald-200 shadow-sm"
                                        >
                                          <FiCheck size={12} strokeWidth={3} />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex justify-center">
                                        {predef.method === "Backup Codes" ? (
                                          <button
                                            onClick={() =>
                                              handleEditRow(idx, currentData)
                                            }
                                            className="px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50 text-purple-600 text-[10px] font-bold hover:bg-purple-100 transition-colors shadow-sm"
                                          >
                                            Manage
                                          </button>
                                        ) : currentData.status === "Disabled" ||
                                          currentData.status ===
                                            "Not Configured" ? (
                                          <button
                                            onClick={() =>
                                              handleEditRow(idx, currentData)
                                            }
                                            className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm"
                                          >
                                            <FiEdit2 size={12} />
                                          </button>
                                        ) : (
                                          <button
                                            onClick={() =>
                                              handleEditRow(idx, currentData)
                                            }
                                            className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm"
                                          >
                                            <FiEdit2 size={12} />
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </React.Fragment>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Clients;
