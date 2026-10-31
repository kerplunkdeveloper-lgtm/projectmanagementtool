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
} from "react-icons/fi";
import SearchableDropdown from "../../components/common/SearchableDropdown";

const DEFAULT_CONTENT_TYPES = [
  "All",
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
    };
    if (isClientDropdownOpen || isDateDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isClientDropdownOpen, isDateDropdownOpen]);

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
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* Row 1: Search Input & Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-80 md:w-96">
          
          <input
            type="text"
            placeholder="Search tasks, clients, creators..."
            value={searchQuery}
            onChange={(e) => {
              if (setSearchQuery) setSearchQuery(e.target.value);
              if (setCurrentPage) setCurrentPage(1);
            }}
            className="w-full h-10 pl-10 pr-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 text-xs sm:text-[13px] font-normal focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs"
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

        {/* Action Controls: Export to Excel + At Risk Toggle */}
        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
          {/* Export to Excel */}
          <button
            type="button"
            onClick={onExportExcel}
            className="inline-flex items-center gap-2 px-4 h-10 rounded-xl text-xs sm:text-[13px] font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all cursor-pointer shadow-sm shadow-blue-500/25 shrink-0"
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
            className={`inline-flex items-center gap-2 px-3.5 h-10 rounded-xl text-xs sm:text-[13px] font-semibold transition-all cursor-pointer border shrink-0 shadow-2xs ${
              atRiskOnly
                ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700 ring-2 ring-rose-400/20"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 hover:border-slate-300"
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

      {/* Row 2: Filter Pills Row */}
      <div className="flex items-center gap-2 flex-wrap min-w-0">
        {/* FILTERS: Label */}
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0 select-none mr-1">
          <FiFilter size={14} className="text-blue-500" />
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
            <div className="absolute left-0 top-full mt-1.5 w-64 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              {/* Search Box */}
              <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
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

        {/* Created by Filter (Admin & Operation Manager only - Social Media Managers) */}
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

        {/* Content Type Filter */}
        <select
          value={selectedContentType}
          onChange={(e) => {
            if (setSelectedContentType) setSelectedContentType(e.target.value);
            if (setCurrentPage) setCurrentPage(1);
          }}
          className={`toolbar-filter-select ${
            selectedContentType !== "All" ? "is-active" : ""
          }`}
        >
          <option value="All">Content type</option>
          {contentTypes
            .filter((c) => c !== "All")
            .map((ct) => (
              <option key={ct} value={ct}>
                {ct}
              </option>
            ))}
        </select>

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

        {/* Commitment Filter */}
        <select
          value={selectedCommitment}
          onChange={(e) => {
            if (setSelectedCommitment) setSelectedCommitment(e.target.value);
            if (setCurrentPage) setCurrentPage(1);
          }}
          className={`toolbar-filter-select ${
            selectedCommitment !== "All" ? "is-active" : ""
          }`}
        >
          <option value="All">Commitment</option>
          {commitments
            .filter((c) => c !== "All")
            .map((com) => (
              <option key={com} value={com}>
                {com}
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
            <div className="absolute right-0 sm:left-0 top-full mt-1.5 w-72 sm:w-80 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3.5 space-y-3 animate-in fade-in zoom-in-95 duration-100">
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
                <div className="grid grid-cols-3 gap-1 p-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-[11px] font-bold">
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
      <div className="flex items-center justify-between pt-1 text-xs text-slate-500 dark:text-slate-400">
        <div>
          Showing{" "}
          <strong className="font-bold text-slate-900 dark:text-white">
            {filteredCount}
          </strong>{" "}
          of{" "}
          <strong className="font-bold text-slate-900 dark:text-white">
            {totalCount}
          </strong>{" "}
          tasks ·{" "}
          <strong className="font-bold text-blue-600 dark:text-blue-400">
            {currentCommitmentsCount}
          </strong>{" "}
          are calendar commitments
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

export default SmTaskFilters;
