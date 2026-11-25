import React, { useMemo, useState } from "react";
import {
  FiRefreshCw,
  FiLayers,
  FiSearch,
  FiCheck,
  FiX,
  FiCalendar,
  FiShoppingCart,
  FiFileText,
  FiUsers,
} from "react-icons/fi";
import {
  SERVICE_CATALOG,
  PROJECT_TYPES,
  BILLING_CYCLES,
  ONE_TIME_TIMELINES,
  createServiceDetail,
  getServiceLabel,
} from "../../../utils/serviceCatalog";

const { RECURRING, ONE_TIME } = PROJECT_TYPES;

const THEME = {
  [RECURRING]: {
    icon: FiRefreshCw,
    title: "Recurring Project",
    subtitle: "Ongoing monthly services (e.g., DM, SEO)",
    group: "Recurring (Ongoing)",
    badge: "Monthly",
    tag: "Recurring",
    accent: "text-emerald-600 dark:text-emerald-400",
    card: "border-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/30 dark:border-emerald-700",
    head: "bg-emerald-50/80 dark:bg-emerald-950/30",
    pill: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    item: "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800/60 dark:bg-emerald-950/20",
    check: "accent-emerald-600",
  },
  [ONE_TIME]: {
    icon: FiLayers,
    title: "One-time Project",
    subtitle: "Fixed scope, start-end (e.g., Branding, Website)",
    group: "One-time (Fixed)",
    badge: "Fixed",
    tag: "One-time",
    accent: "text-violet-600 dark:text-violet-400",
    card: "border-violet-400 bg-violet-50/70 dark:bg-violet-950/30 dark:border-violet-700",
    head: "bg-violet-50/80 dark:bg-violet-950/30",
    pill: "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300",
    item: "border-violet-200 bg-violet-50/50 dark:border-violet-800/60 dark:bg-violet-950/20",
    check: "accent-violet-600",
  },
};

const inputCls =
  "w-full h-8 rounded-lg border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1e293b] px-2 text-[11px] text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 font-semibold [color-scheme:light] dark:[color-scheme:dark]";
const labelCls = "block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1";

const ServicePlanStep = ({ formData, setFormData, membersSlot }) => {
  const details = formData.serviceDetails || [];
  const [search, setSearch] = useState("");

  // Which project types are switched on. Starts from what's already selected
  // (edit mode); defaults to Recurring for a brand-new client.
  const [enabledTypes, setEnabledTypes] = useState(() => {
    const present = new Set(details.map((d) => d.type));
    return present.size ? present : new Set([RECURRING]);
  });

  const commit = (nextDetails) =>
    setFormData((prev) => ({
      ...prev,
      serviceDetails: nextDetails,
      service: nextDetails.map((d) => d.name),
    }));

  const toggleType = (type) => {
    const next = new Set(enabledTypes);
    if (next.has(type)) {
      if (next.size === 1) return; // at least one type must stay on
      const affected = details.filter((d) => d.type === type);
      if (
        affected.length &&
        !window.confirm(
          `Turning off ${THEME[type].title} will remove ${affected.length} selected service(s). Continue?`,
        )
      ) {
        return;
      }
      next.delete(type);
      if (affected.length) commit(details.filter((d) => d.type !== type));
    } else {
      next.add(type);
    }
    setEnabledTypes(next);
  };

  const toggleService = (svc) => {
    if (details.some((d) => d.name === svc.value)) {
      commit(details.filter((d) => d.name !== svc.value));
    } else {
      commit([...details, createServiceDetail(svc.value, formData.onboardingDate)]);
    }
  };

  const updateDetail = (name, patch) =>
    commit(details.map((d) => (d.name === name ? { ...d, ...patch } : d)));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? SERVICE_CATALOG.filter((s) => s.label.toLowerCase().includes(q)) : SERVICE_CATALOG;
  }, [search]);

  const counts = {
    [RECURRING]: details.filter((d) => d.type === RECURRING).length,
    [ONE_TIME]: details.filter((d) => d.type === ONE_TIME).length,
  };

  return (
    <div className="space-y-3.5">
      {/* PROJECT TYPE CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[RECURRING, ONE_TIME].map((type) => {
          const t = THEME[type];
          const on = enabledTypes.has(type);
          const Icon = t.icon;
          return (
            <button
              key={type}
              type="button"
              onClick={() => toggleType(type)}
              aria-pressed={on}
              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                on ? t.card : "border-slate-200 dark:border-[#334155] bg-white dark:bg-[#131c31] hover:border-slate-300"
              }`}
            >
              <Icon size={20} className={on ? t.accent : "text-slate-500"} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-800 dark:text-white">{t.title}</div>
                <div className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">{t.subtitle}</div>
              </div>
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  on
                    ? type === RECURRING
                      ? "bg-emerald-600 text-white"
                      : "bg-violet-600 text-white"
                    : "border-2 border-slate-300 dark:border-slate-600"
                }`}
              >
                {on && <FiCheck size={11} className="stroke-[3]" />}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* LEFT: SERVICE CATALOG */}
        <div className="space-y-2.5">
          <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <FiLayers size={11} /> Select Services
          </label>
          <div className="relative">
            <FiSearch size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search services..."
              style={{ paddingLeft: 32 }}
              className="w-full h-9 rounded-lg border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1e293b] pl-8 pr-3 text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-slate-400"
            />
          </div>

          {[RECURRING, ONE_TIME].map((type) => {
            const t = THEME[type];
            const on = enabledTypes.has(type);
            const items = filtered.filter((s) => s.type === type);
            if (!items.length) return null;
            return (
              <div
                key={type}
                className={`rounded-xl border overflow-hidden transition-opacity ${
                  on ? "border-slate-200 dark:border-[#334155]" : "border-dashed border-slate-200 dark:border-[#334155] opacity-55"
                }`}
              >
                <div className={`flex items-center justify-between px-3 py-2 ${t.head}`}>
                  <span className={`text-[11.5px] font-bold flex items-center gap-1.5 ${t.accent}`}>
                    <FiShoppingCart size={12} /> {t.group}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${t.pill}`}>{t.badge}</span>
                </div>
                <div className="p-1.5">
                  {items.map((svc) => {
                    const checked = details.some((d) => d.name === svc.value);
                    return (
                      <label
                        key={svc.value}
                        className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 ${
                          on ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-[#1e293b]" : "cursor-not-allowed"
                        }`}
                        title={on ? "" : `Enable ${t.title} above to add this service`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!on}
                          onChange={() => toggleService(svc)}
                          className={`w-4 h-4 rounded ${t.check}`}
                        />
                        <span className="flex-1">{svc.label}</span>
                        <t.icon size={12} className={t.accent} />
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {!filtered.length && (
            <p className="text-[11px] text-slate-400 text-center py-4">No services match “{search}”.</p>
          )}
        </div>

        {/* RIGHT: MEMBERS + SELECTED SERVICES */}
        <div className="space-y-2.5">
          <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <FiUsers size={11} /> Assign to Members
          </label>
          {membersSlot}

          <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 pt-1">
            <FiShoppingCart size={11} /> Selected Services ({details.length})
          </label>

          {details.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 dark:border-[#334155] p-4 text-center text-[11px] text-slate-400">
              Pick services on the left to configure billing & timelines.
            </div>
          )}

          {details.map((d) => {
            const t = THEME[d.type];
            const isRecurring = d.type === RECURRING;
            const openEnded = !isRecurring && d.timeline === "Open (TBD)";
            return (
              <div key={d.name} className={`rounded-xl border p-3 space-y-2 ${t.item}`}>
                <div className="flex items-center gap-2">
                  <t.icon size={14} className={t.accent} />
                  <span className="text-xs font-bold text-slate-800 dark:text-white truncate">
                    {getServiceLabel(d.name)}
                  </span>
                  <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-md ${t.pill}`}>{t.tag}</span>
                  <button
                    type="button"
                    onClick={() => commit(details.filter((x) => x.name !== d.name))}
                    className="ml-auto text-slate-400 hover:text-rose-500 cursor-pointer"
                    aria-label={`Remove ${getServiceLabel(d.name)}`}
                  >
                    <FiX size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className={labelCls}>{isRecurring ? "Billing Cycle" : "Project Timeline"}</span>
                    <select
                      value={isRecurring ? d.billingCycle : d.timeline}
                      onChange={(e) =>
                        updateDetail(
                          d.name,
                          isRecurring
                            ? { billingCycle: e.target.value }
                            : { timeline: e.target.value, ...(e.target.value === "Open (TBD)" ? { endDate: "" } : {}) },
                        )
                      }
                      className={`${inputCls} cursor-pointer`}
                    >
                      {(isRecurring ? BILLING_CYCLES : ONE_TIME_TIMELINES).map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className={labelCls}>Start Date</span>
                    <input
                      type="date"
                      value={d.startDate || ""}
                      onChange={(e) => updateDetail(d.name, { startDate: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <span className={labelCls}>End Date</span>
                    {openEnded ? (
                      <div className={`${inputCls} flex items-center text-slate-400`}>TBD</div>
                    ) : (
                      <input
                        type="date"
                        value={d.endDate || ""}
                        min={d.startDate || undefined}
                        onChange={(e) => updateDetail(d.name, { endDate: e.target.value })}
                        className={inputCls}
                        title={isRecurring ? "Leave empty for an ongoing engagement" : ""}
                      />
                    )}
                    {isRecurring && !d.endDate && (
                      <span className="text-[9.5px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                        <FiCalendar size={9} /> Ongoing
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* SUMMARY */}
          <div className="rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#131c31] p-3 space-y-1.5">
            <div className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <FiFileText size={13} /> Project Summary
            </div>
            {[RECURRING, ONE_TIME].map((type) => (
              <div key={type} className="flex items-center justify-between text-[11.5px] text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  {React.createElement(THEME[type].icon, { size: 12, className: THEME[type].accent })}
                  {type === RECURRING ? "Recurring Services" : "One-time Services"}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${THEME[type].pill}`}>
                  {counts[type]} service{counts[type] === 1 ? "" : "s"} ({THEME[type].badge})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicePlanStep;
