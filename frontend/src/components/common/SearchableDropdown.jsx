import React, { useState, useRef, useEffect, useMemo } from "react";
import { FiSearch, FiChevronDown, FiX, FiCheck } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const SearchableDropdown = ({
  options = [], // [{ value, label, group? }] or array of strings
  value,
  onChange,
  placeholder = "Select...",
  allLabel = null, // e.g. "All clients" (value: "All")
  searchPlaceholder = "Search...",
  emptyText = "No results found",
  className = "",
  buttonClassName = "",
  menuWidth = "w-64",
  disabled = false,
  groupBy = false,
  maxHeight = "max-h-60",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Normalize options to [{ value, label, group? }]
  const normalizedOptions = useMemo(() => {
    const list = [];
    if (allLabel) {
      list.push({ value: "All", label: allLabel });
    }

    (options || []).forEach((opt) => {
      if (typeof opt === "string") {
        if (opt === "All" && allLabel) return;
        list.push({ value: opt, label: opt });
      } else if (opt && typeof opt === "object") {
        if (opt.value === "All" && allLabel) return;
        list.push({
          value: opt.value ?? opt.label,
          label: opt.label ?? opt.value,
          group: opt.group,
        });
      }
    });

    return list;
  }, [options, allLabel]);

  const selectedOption = useMemo(
    () => normalizedOptions.find((opt) => opt.value === value),
    [normalizedOptions, value]
  );

  const displayLabel = useMemo(() => {
    if (selectedOption) return selectedOption.label;
    if (value && value !== "All") return value;
    if (allLabel) return allLabel;
    return placeholder;
  }, [selectedOption, value, allLabel, placeholder]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return normalizedOptions;
    const lowerSearch = searchTerm.trim().toLowerCase();
    return normalizedOptions.filter((opt) =>
      opt.label.toLowerCase().includes(lowerSearch)
    );
  }, [normalizedOptions, searchTerm]);

  const groupedOptions = useMemo(() => {
    if (!groupBy) return { ungrouped: filteredOptions };
    const groups = {};
    filteredOptions.forEach((opt) => {
      const g = opt.group || "Other";
      if (!groups[g]) groups[g] = [];
      groups[g].push(opt);
    });
    return groups;
  }, [filteredOptions, groupBy]);

  const handleSelect = (val) => {
    if (onChange) onChange(val);
    setIsOpen(false);
    setSearchTerm("");
  };

  const isFiltered = value && value !== "All";

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          const nextOpen = !isOpen;
          setIsOpen(nextOpen);
          if (nextOpen) {
            setTimeout(() => inputRef.current?.focus(), 60);
          } else {
            setSearchTerm("");
          }
        }}
        className={
          buttonClassName
            ? `${buttonClassName} ${isFiltered ? "is-active" : ""}`
            : `w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isFiltered
                  ? "bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs"
                  : "bg-white dark:bg-[#1e293b] text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`
        }
        title={typeof displayLabel === "string" ? displayLabel : undefined}
      >
        <span className="truncate max-w-[130px] sm:max-w-[170px] text-left">
          {displayLabel}
        </span>
        <FiChevronDown
          size={13}
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-indigo-500" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className={`absolute z-[80] top-full left-0 mt-1.5 ${menuWidth} min-w-[210px] bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden flex flex-col`}
          >
            {/* Search Input Box */}
            <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-[#1e293b]/60 flex items-center gap-2">
              <FiSearch size={13} className="text-slate-400 shrink-0 ml-1" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent outline-none text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                  title="Clear search"
                >
                  <FiX size={12} />
                </button>
              )}
            </div>

            {/* Options List */}
            <div className={`${maxHeight} overflow-y-auto scrollbar-thin py-1`}>
              {filteredOptions.length === 0 ? (
                <div className="py-4 px-3 text-center text-xs text-slate-400 italic">
                  {emptyText}
                </div>
              ) : groupBy ? (
                Object.entries(groupedOptions).map(([group, opts]) => (
                  <div key={group} className="mb-1 last:mb-0">
                    <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50">
                      {group}
                    </div>
                    {opts.map((opt) => {
                      const isSelected = value === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleSelect(opt.value)}
                          className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold"
                              : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1e293b]"
                          }`}
                        >
                          <span className="truncate pr-2">{opt.label}</span>
                          {isSelected && (
                            <FiCheck size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = value === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold"
                          : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1e293b]"
                      }`}
                    >
                      <span className="truncate pr-2">{opt.label}</span>
                      {isSelected && (
                        <FiCheck size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchableDropdown;
