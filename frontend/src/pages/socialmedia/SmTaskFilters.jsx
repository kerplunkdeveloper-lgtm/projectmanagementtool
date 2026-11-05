import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  FiFilter,
  FiSearch,
  FiX,
  FiChevronDown,
  FiCheck,
  FiCalendar,
  FiRotateCcw,
  FiDownload,
  FiImage,
  FiPlay,
  FiZap,
  FiLayers,
  FiGrid,
} from "react-icons/fi";
import SearchableDropdown from "../../components/common/SearchableDropdown";

const DEFAULT_CATEGORIES = [
  "All",
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

const DEFAULT_CONTENT_TYPES = [
  "All",
  "Post",
  "Reels",
  "Stories",
  "Others Task",
  "Reel",
  "Story",
  "Carousel",
  "GMB",
  "YouTube",
  "Blog",
  "Ad",
  "Other",
];
const DEFAULT_STATUSES = [
  "All",
  "In QC",
  "Scheduled",
  "Overdue",
  "Not started",
  "In progress",
  "Completed",
  "Live",
];
const DEFAULT_PRIORITIES = ["All", "High", "Medium", "Low"];
const DEFAULT_COMMITMENTS = ["All", "Yes", "No"];

const SmTaskFilters = ({
  searchQuery = "",
  setSearchQuery,
  onExportExcel,
  atRiskOnly = false,
  setAtRiskOnly,
  selectedClient = "All",
  setSelectedClient,
  clientOptions = [],
  canFilterByCreatedBy = false,
  selectedCreatedBy = "All",
  setSelectedCreatedBy,
  createdByOptions = [],
  user,
  selectedCategory = "All",
  setSelectedCategory,
  categories = DEFAULT_CATEGORIES,
  selectedContentType = "All",
  setSelectedContentType,
  contentTypes = DEFAULT_CONTENT_TYPES,
  selectedStatus = "All",
  setSelectedStatus,
  statuses = DEFAULT_STATUSES,
  selectedPriority = "All",
  setSelectedPriority,
  priorities = DEFAULT_PRIORITIES,
  selectedCommitment = "All",
  setSelectedCommitment,
  commitments = DEFAULT_COMMITMENTS,
  dateFilterPreset = "All",
  setDateFilterPreset,
  dateFilterField = "any",
  setDateFieldType,
  customStartDate = "",
  setCustomStartDate,
  customEndDate = "",
  setCustomEndDate,
  filteredCount = 0,
  totalCount = 0,
  currentCommitmentsCount = 0,
  hasActiveFilters = false,
  onResetFilters,
  setCurrentPage,
}) => {
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const clientDropdownRef = useRef(null);

  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const dateDropdownRef = useRef(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const [isContentTypeDropdownOpen, setIsContentTypeDropdownOpen] = useState(false);
  const contentTypeDropdownRef = useRef(null);

  // Close popover dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        clientDropdownRef.current &&
        !clientDropdownRef.current.contains(event.target)
      ) {
        setIsClientDropdownOpen(false);
      }
      if (
        dateDropdownRef.current &&
        !dateDropdownRef.current.contains(event.target)
      ) {
        setIsDateDropdownOpen(false);
      }
      if (
        contentTypeDropdownRef.current &&
        !contentTypeDropdownRef.current.contains(event.target)
      ) {
        setIsContentTypeDropdownOpen(false);
      }
    };
    if (isClientDropdownOpen || isDateDropdownOpen || isContentTypeDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isClientDropdownOpen, isDateDropdownOpen, isContentTypeDropdownOpen]);

  const dateFilterLabel = useMemo(() => {
    if (customStartDate && customEndDate) {
      return `${customStartDate} → ${customEndDate}`;
    }
    if (customStartDate) {
      return `Date: ${customStartDate}`;
    }
    if (dateFilterPreset !== "All") {
      return `Date: ${dateFilterPreset}`;
    }
    return "Date";
  }, [dateFilterPreset, customStartDate, customEndDate]);

  const isDateFilterActive = useMemo(() => {
    return (
      dateFilterPreset !== "All" ||
      Boolean(customStartDate) ||
      Boolean(customEndDate)
    );
  }, [dateFilterPreset, customStartDate, customEndDate]);

  // Filtered client options matching search box inside dropdown
  const filteredClientOptions = useMemo(() => {
    const list = (clientOptions || []).filter((c) => c !== "All");
    if (!clientSearchQuery.trim()) return list;
    const q = clientSearchQuery.trim().toLowerCase();
    return list.filter((c) => c.toLowerCase().includes(q));
  }, [clientOptions, clientSearchQuery]);

  return (
    <div className="bg-white dark:bg-[#0b101d] border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* Row 1: Search Input & Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input with Search Icon */}
        <div className="flex items-center gap-2 w-full sm:w-80 md:w-96">
          <div className="relative flex-1">
         
          <input
            type="text"
            placeholder="Search tasks, clients, creators..."
            value={searchQuery}
            onChange={(e) => {
              if (setSearchQuery) setSearchQuery(e.target.value);
              if (setCurrentPage) setCurrentPage(1);
            }}
            className="w-full h-10 pl-10 pr-9 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#131d31] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 text-xs sm:text-[13px] font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                if (setSearchQuery) setSearchQuery("");
                if (setCurrentPage) setCurrentPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title="Clear search"
            >
              <FiX size={14} />
            </button>
          )}
          </div>

          {/* Mobile Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
            className={`sm:hidden h-10 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all shrink-0 cursor-pointer ${
              isMobileFiltersOpen || hasActiveFilters
                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                : "bg-white dark:bg-[#131d31] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10"
            }`}
          >
            <FiFilter size={13} className="text-emerald-600 dark:text-emerald-400" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            )}
          </button>
        </div>

        {/* Action Controls: Export to Excel + At Risk Toggle */}
        <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
          {/* Export to Excel */}
          <button
            type="button"
            onClick={onExportExcel}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 sm:px-4 h-10 rounded-xl text-xs sm:text-[13px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-all cursor-pointer shadow-sm shadow-emerald-600/20 shrink-0"
            title="Export filtered tasks to Excel"
          >
            <FiDownload size={14} className="stroke-[2.5]" />
            <span>Export to Excel</span>
          </button>

          {/* At Risk Toggle Button */}
          <button
            type="button"
            onClick={() => {
              if (setAtRiskOnly) setAtRiskOnly(!atRiskOnly);
              if (setCurrentPage) setCurrentPage(1);
            }}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 sm:px-3.5 h-10 rounded-xl text-xs sm:text-[13px] font-semibold transition-all cursor-pointer border shrink-0 shadow-2xs ${
              atRiskOnly
                ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700 ring-2 ring-rose-400/20"
                : "bg-white dark:bg-[#131d31] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-[#182338] hover:border-slate-300"
            }`}
            title="Filter tasks at risk (due in <= 24 hours)"
          >
            <span className="relative flex h-2.5 w-2.5 items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-4 ring-rose-100 dark:ring-rose-900/60 shrink-0"></span>
            </span>
            <span>At risk</span>
          </button>
        </div>
      </div>

      {/* Row 2: Filter Pills Row (Horizontally scrollable on mobile) */}
      <div className={`flex items-center gap-2 overflow-x-auto scrollbar-none py-1 sm:overflow-visible sm:flex-wrap min-w-0 ${isMobileFiltersOpen ? "flex" : "hidden sm:flex"}`}>
        {/* FILTERS: Label */}
        <div className="inline-flex items-center gap-1.5 h-[2.25rem] text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0 select-none mr-1">
          <FiFilter size={14} className="text-emerald-500 dark:text-emerald-400 stroke-[2.5]" />
          <span>FILTERS:</span>
        </div>

        {/* Client Filter - Searchable Dropdown */}
        <div className="relative" ref={clientDropdownRef}>
          <button
            type="button"
            onClick={() => {
              setIsClientDropdownOpen(!isClientDropdownOpen);
              setClientSearchQuery("");
            }}
            className={`toolbar-filter-btn ${
              selectedClient !== "All" ? "is-active" : ""
            }`}
            title="Filter by Client"
          >
            <span className="truncate max-w-[120px]">
              {selectedClient === "All" ? "All clients" : selectedClient}
            </span>
            <FiChevronDown
              size={14}
              className={`text-slate-400 transition-transform duration-150 shrink-0 ${
                isClientDropdownOpen ? "rotate-180 text-blue-500" : ""
              }`}
            />
          </button>

          {/* Dropdown Menu with Search Box */}
          {isClientDropdownOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-64 z-50 bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              {/* Search Box */}
              <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-[#131d31]/80">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Search clients..."
                    value={clientSearchQuery}
                    onChange={(e) => setClientSearchQuery(e.target.value)}
                    className="client-dropdown-search-input w-full"
                    autoFocus
                  />
                  {clientSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setClientSearchQuery("")}
                      className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      title="Clear"
                    >
                      <FiX size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Clients Options List */}
              <div className="max-h-56 overflow-y-auto py-1 custom-scrollbar text-xs">
                {/* All clients option */}
                <button
                  type="button"
                  onClick={() => {
                    if (setSelectedClient) setSelectedClient("All");
                    if (setCurrentPage) setCurrentPage(1);
                    setIsClientDropdownOpen(false);
                    setClientSearchQuery("");
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors cursor-pointer ${
                    selectedClient === "All"
                      ? "bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>All clients</span>
                  {selectedClient === "All" && (
                    <FiCheck size={13} className="text-blue-600 shrink-0" />
                  )}
                </button>

                {/* Filtered Clients */}
                {filteredClientOptions.length === 0 ? (
                  <div className="px-3 py-4 text-center text-xs text-slate-400 italic">
                    No clients found
                  </div>
                ) : (
                  filteredClientOptions.map((client) => {
                    const isSelected = selectedClient === client;
                    return (
                      <button
                        key={client}
                        type="button"
                        onClick={() => {
                          if (setSelectedClient) setSelectedClient(client);
                          if (setCurrentPage) setCurrentPage(1);
                          setIsClientDropdownOpen(false);
                          setClientSearchQuery("");
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold"
                            : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <span className="truncate pr-2">{client}</span>
                        {isSelected && (
                          <FiCheck size={13} className="text-blue-600 shrink-0" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Created by Filter (Admin & Operation Manager only - Social Media Executives) */}
        {canFilterByCreatedBy ? (
          <SearchableDropdown
            value={selectedCreatedBy}
            onChange={(val) => {
              if (setSelectedCreatedBy) setSelectedCreatedBy(val);
              if (setCurrentPage) setCurrentPage(1);
            }}
            options={createdByOptions.filter((c) => c !== "All")}
            allLabel="Created by (SMM)"
            placeholder="Created by (SMM)"
            searchPlaceholder="Search creator..."
            emptyText="No creators found"
            menuWidth="w-64"
            buttonClassName="toolbar-filter-btn"
          />
        ) : (
          <div
            className="toolbar-filter-btn cursor-default select-none opacity-85"
            title="Viewing tasks created by you"
          >
            <span className="truncate max-w-[130px]">
              {user?.name || "Created by (SMM)"}
            </span>
            <FiChevronDown size={14} className="text-slate-400 shrink-0" />
          </div>
        )}

        {/* Category Filter - Fixed Badge with Calendar Icon for Commitment, Dropdown for Non-commitment */}
        {selectedCommitment === "Yes" ? (
          <div
            className="inline-flex items-center gap-1.5 h-[2.25rem] px-3.5 rounded-xl text-xs font-bold bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 shadow-2xs select-none"
            title="Category is fixed to Content Calendar for Commitment tasks"
          >
            <FiCalendar size={13} className="text-indigo-500 shrink-0 stroke-[2.5]" />
            <span>Content Calendar</span>
          </div>
        ) : (
          <select
            value={selectedCategory}
            onChange={(e) => {
              if (setSelectedCategory) setSelectedCategory(e.target.value);
              if (setCurrentPage) setCurrentPage(1);
            }}
            className={`toolbar-filter-select ${
              selectedCategory !== "All" ? "is-active" : ""
            }`}
          >
            <option value="All">Category</option>
            {categories
              .filter(
                (c) =>
                  c !== "All" &&
                  c.trim().toLowerCase() !== "content calendar" &&
                  c.trim().toLowerCase() !== "content calendor" &&
                  c.trim().toLowerCase() !== "content"
              )
              .map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
          </select>
        )}

        {/* Content Type Filter - Colorful Dropdown for Commitment, Fixed Badge for Non-commitment */}
        {selectedCommitment === "No" ? (
          <div
            className="inline-flex items-center gap-1.5 h-[2.25rem] px-3.5 rounded-xl text-xs font-bold bg-slate-100/90 dark:bg-[#131d31] text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 shadow-2xs select-none"
            title="Content type is fixed to Others Task for Non-commitment tasks"
          >
            <FiLayers size={13} className="text-slate-500 shrink-0 stroke-[2.5]" />
            <span>Others Task</span>
          </div>
        ) : (
          <div className="relative" ref={contentTypeDropdownRef}>
            <button
              type="button"
              onClick={() => setIsContentTypeDropdownOpen(!isContentTypeDropdownOpen)}
              className={`toolbar-filter-btn flex items-center gap-2 ${
                selectedContentType !== "All"
                  ? "is-active ring-1 ring-emerald-500/30"
                  : ""
              }`}
              title="Filter by Content Type"
            >
              {(() => {
                if (selectedContentType === "Post") {
                  return (
                    <span className="inline-flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400">
                      <FiImage size={13} className="text-blue-500 stroke-[2.5]" />
                      <span>Post</span>
                    </span>
                  );
                }
                if (selectedContentType === "Reels" || selectedContentType === "Reel") {
                  return (
                    <span className="inline-flex items-center gap-1.5 font-bold text-fuchsia-600 dark:text-fuchsia-400">
                      <FiPlay size={13} className="text-fuchsia-500 fill-fuchsia-500" />
                      <span>Reels</span>
                    </span>
                  );
                }
                if (selectedContentType === "Stories" || selectedContentType === "Story") {
                  return (
                    <span className="inline-flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                      <FiZap size={13} className="text-amber-500 fill-amber-500" />
                      <span>Stories</span>
                    </span>
                  );
                }
                return <span>Content type</span>;
              })()}
              <FiChevronDown
                size={14}
                className={`text-slate-400 transition-transform duration-150 shrink-0 ${
                  isContentTypeDropdownOpen ? "rotate-180 text-emerald-500" : ""
                }`}
              />
            </button>

            {/* Custom Colorful Content Type Dropdown Menu */}
            {isContentTypeDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-48 z-50 bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden p-1.5 animate-in fade-in zoom-in-95 duration-100">
                {/* Option 1: All Content Types */}
                <button
                  type="button"
                  onClick={() => {
                    if (setSelectedContentType) setSelectedContentType("All");
                    if (setCurrentPage) setCurrentPage(1);
                    setIsContentTypeDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    selectedContentType === "All"
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-[#182338] flex items-center justify-center text-slate-400">
                      <FiGrid size={12} />
                    </div>
                    <span>All Content types</span>
                  </div>
                  {selectedContentType === "All" && (
                    <FiCheck size={14} className="text-emerald-500 stroke-[3]" />
                  )}
                </button>

                {/* Option 2: Post (Blue) */}
                <button
                  type="button"
                  onClick={() => {
                    if (setSelectedContentType) setSelectedContentType("Post");
                    if (setCurrentPage) setCurrentPage(1);
                    setIsContentTypeDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer mt-0.5 ${
                    selectedContentType === "Post"
                      ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-blue-50/50 dark:hover:bg-blue-950/30"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <FiImage size={13} className="stroke-[2.5]" />
                    </div>
                    <span className="font-bold">Post</span>
                  </div>
                  {selectedContentType === "Post" && (
                    <FiCheck size={14} className="text-blue-600 stroke-[3]" />
                  )}
                </button>

                {/* Option 3: Reels (Fuchsia/Pink) */}
                <button
                  type="button"
                  onClick={() => {
                    if (setSelectedContentType) setSelectedContentType("Reels");
                    if (setCurrentPage) setCurrentPage(1);
                    setIsContentTypeDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer mt-0.5 ${
                    selectedContentType === "Reels" || selectedContentType === "Reel"
                      ? "bg-fuchsia-50 dark:bg-fuchsia-950/60 text-fuchsia-700 dark:text-fuchsia-300 font-bold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-fuchsia-50/50 dark:hover:bg-fuchsia-950/30"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-fuchsia-100 dark:bg-fuchsia-900/50 flex items-center justify-center text-fuchsia-600 dark:text-fuchsia-400">
                      <FiPlay size={13} className="fill-fuchsia-600 dark:fill-fuchsia-400" />
                    </div>
                    <span className="font-bold">Reels</span>
                  </div>
                  {(selectedContentType === "Reels" || selectedContentType === "Reel") && (
                    <FiCheck size={14} className="text-fuchsia-600 stroke-[3]" />
                  )}
                </button>

                {/* Option 4: Stories (Amber/Orange) */}
                <button
                  type="button"
                  onClick={() => {
                    if (setSelectedContentType) setSelectedContentType("Stories");
                    if (setCurrentPage) setCurrentPage(1);
                    setIsContentTypeDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer mt-0.5 ${
                    selectedContentType === "Stories" || selectedContentType === "Story"
                      ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-amber-50/50 dark:hover:bg-amber-950/30"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <FiZap size={13} className="fill-amber-500/40 text-amber-600 stroke-[2.5]" />
                    </div>
                    <span className="font-bold">Stories</span>
                  </div>
                  {(selectedContentType === "Stories" || selectedContentType === "Story") && (
                    <FiCheck size={14} className="text-amber-600 stroke-[3]" />
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => {
            if (setSelectedStatus) setSelectedStatus(e.target.value);
            if (setCurrentPage) setCurrentPage(1);
          }}
          className={`toolbar-filter-select ${
            selectedStatus !== "All" ? "is-active" : ""
          }`}
        >
          <option value="All">Status</option>
          {statuses
            .filter((c) => c !== "All")
            .map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
        </select>

        {/* Priority Filter */}
        <select
          value={selectedPriority}
          onChange={(e) => {
            if (setSelectedPriority) setSelectedPriority(e.target.value);
            if (setCurrentPage) setCurrentPage(1);
          }}
          className={`toolbar-filter-select ${
            selectedPriority !== "All" ? "is-active" : ""
          }`}
        >
          <option value="All">Priority</option>
          {priorities
            .filter((c) => c !== "All")
            .map((pr) => (
              <option key={pr} value={pr}>
                {pr}
              </option>
            ))}
        </select>



        {/* Date Filter Popover */}
        <div className="relative" ref={dateDropdownRef}>
          <button
            type="button"
            onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
            className={`toolbar-filter-btn ${
              isDateFilterActive ? "is-active" : ""
            }`}
            title="Filter by Date"
          >
            <div className="flex items-center gap-1.5 truncate max-w-[150px]">
              <FiCalendar
                size={13}
                className={
                  isDateFilterActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-400"
                }
              />
              <span className="truncate">{dateFilterLabel}</span>
            </div>
            <FiChevronDown
              size={14}
              className={`text-slate-400 transition-transform duration-150 shrink-0 ${
                isDateDropdownOpen ? "rotate-180 text-blue-500" : ""
              }`}
            />
          </button>

          {/* Date Filter Popover Menu */}
          {isDateDropdownOpen && (
            <div className="absolute right-0 sm:left-0 top-full mt-1.5 w-72 sm:w-80 z-50 bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl p-3.5 space-y-3 animate-in fade-in zoom-in-95 duration-100">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900 dark:text-white">
                  <FiCalendar size={14} className="text-indigo-500" />
                  <span>Filter by Date</span>
                </div>
                {isDateFilterActive && (
                  <button
                    type="button"
                    onClick={() => {
                      if (setDateFilterPreset) setDateFilterPreset("All");
                      if (setCustomStartDate) setCustomStartDate("");
                      if (setCustomEndDate) setCustomEndDate("");
                      if (setCurrentPage) setCurrentPage(1);
                    }}
                    className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                  >
                    Reset date
                  </button>
                )}
              </div>

              {/* Target Date Field (Any Date vs Publish Date vs Due Date) */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Target Date Field
                </span>
                <div className="grid grid-cols-3 gap-1 p-0.5 bg-slate-100 dark:bg-[#131d31] rounded-xl text-[11px] font-bold border border-slate-200/60 dark:border-white/10">
                  {[
                    { id: "any", label: "Any Date" },
                    { id: "publish", label: "Publish" },
                    { id: "due", label: "Due Date" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        if (setDateFieldType) setDateFieldType(f.id);
                        if (setCurrentPage) setCurrentPage(1);
                      }}
                      className={`py-1 rounded-lg transition-colors cursor-pointer text-center ${
                        dateFilterField === f.id
                          ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Quick Presets
                </span>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {[
                    { id: "All", label: "All Dates" },
                    { id: "Today", label: "Today" },
                    { id: "Tomorrow", label: "Tomorrow" },
                    { id: "This Week", label: "This Week" },
                    { id: "This Month", label: "This Month" },
                    { id: "Overdue", label: "Overdue" },
                  ].map((p) => {
                    const isSelected =
                      dateFilterPreset === p.id &&
                      !customStartDate &&
                      !customEndDate;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          if (setDateFilterPreset) setDateFilterPreset(p.id);
                          if (setCustomStartDate) setCustomStartDate("");
                          if (setCustomEndDate) setCustomEndDate("");
                          if (setCurrentPage) setCurrentPage(1);
                          if (p.id !== "Custom") {
                            setIsDateDropdownOpen(false);
                          }
                        }}
                        className={`px-2 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                          isSelected
                            ? "bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-bold"
                            : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Range */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Custom Range
                  </span>
                  {(customStartDate || customEndDate) && (
                    <button
                      type="button"
                      onClick={() => {
                        if (setCustomStartDate) setCustomStartDate("");
                        if (setCustomEndDate) setCustomEndDate("");
                        if (setDateFilterPreset) setDateFilterPreset("All");
                        if (setCurrentPage) setCurrentPage(1);
                      }}
                      className="text-[10px] font-bold text-rose-500 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
                      From / Specific
                    </span>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => {
                        if (setCustomStartDate) setCustomStartDate(e.target.value);
                        if (setDateFilterPreset) setDateFilterPreset("Custom");
                        if (setCurrentPage) setCurrentPage(1);
                      }}
                      className="date-filter-picker-input w-full"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
                      To (Optional)
                    </span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => {
                        if (setCustomEndDate) setCustomEndDate(e.target.value);
                        if (setDateFilterPreset) setDateFilterPreset("Custom");
                        if (setCurrentPage) setCurrentPage(1);
                      }}
                      className="date-filter-picker-input w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Done Button */}
              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsDateDropdownOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Meta Info (Showing X of Y tasks · Z are calendar commitments) */}
      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span>Showing</span>
          <strong className="font-bold text-slate-900 dark:text-white">
            {filteredCount}
          </strong>
          <span>of</span>
          <strong className="font-bold text-slate-900 dark:text-white">
            {totalCount}
          </strong>
          <span>tasks</span>
          <span className="text-slate-300 dark:text-slate-600 font-normal">•</span>
          <strong className="font-bold text-emerald-600 dark:text-emerald-400">
            {currentCommitmentsCount}
          </strong>
          <span>are calendar commitments</span>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
            title="Reset all active filters"
          >
            <FiRotateCcw size={12} />
            <span>Reset filters</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(SmTaskFilters);
