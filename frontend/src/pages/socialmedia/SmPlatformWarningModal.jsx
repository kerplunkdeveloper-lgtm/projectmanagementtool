import React, { useState, useEffect, useMemo } from "react";
import {
  FaInstagram,
  FaFacebook,
  FaYoutube,
  FaGoogle,
  FaTwitter,
  FaLinkedin,
} from "react-icons/fa";
import {
  FiAlertTriangle,
  FiCheck,
  FiX,
  FiLayers,
  FiCheckCircle,
  FiArrowRight,
} from "react-icons/fi";

const ALL_PLATFORMS_MAP = [
  { id: "Instagram", name: "Instagram", icon: FaInstagram, color: "#E1306C" },
  { id: "Facebook", name: "Facebook", icon: FaFacebook, color: "#1877F2" },
  { id: "YouTube", name: "YouTube", icon: FaYoutube, color: "#FF0000" },
  { id: "GMB", name: "GMB", icon: FaGoogle, color: "#4285F4" },
  { id: "Twitter", name: "Twitter", icon: FaTwitter, color: "#1DA1F2" },
  { id: "LinkedIn", name: "LinkedIn", icon: FaLinkedin, color: "#0A66C2" },
];

export default function SmPlatformWarningModal({
  isOpen,
  onClose,
  task,
  targetStatus,
  onConfirm,
}) {
  const [selectedCompleted, setSelectedCompleted] = useState([]);

  const assignedPlatforms = useMemo(() => {
    if (!task) return [];
    if (Array.isArray(task.platforms) && task.platforms.length > 0) {
      return task.platforms;
    }
    return task.platform ? [task.platform] : [];
  }, [task]);

  useEffect(() => {
    if (task && isOpen) {
      const initial = Array.isArray(task.completedPlatforms)
        ? [...task.completedPlatforms]
        : [];
      setSelectedCompleted(initial);
    }
  }, [task, isOpen]);

  if (!isOpen || !task) return null;

  const isPlatformDone = (platId) => {
    return selectedCompleted.some(
      (p) => p.toLowerCase() === platId.toLowerCase()
    );
  };

  const untickedPlatforms = assignedPlatforms.filter((p) => !isPlatformDone(p));
  const isAllDone = assignedPlatforms.length > 0 && untickedPlatforms.length === 0;

  const togglePlatform = (platId) => {
    setSelectedCompleted((prev) => {
      const exists = prev.some((p) => p.toLowerCase() === platId.toLowerCase());
      if (exists) {
        return prev.filter((p) => p.toLowerCase() !== platId.toLowerCase());
      } else {
        return [...prev, platId];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedCompleted([...assignedPlatforms]);
  };

  const handleSaveWithCompleted = (platformsToSave) => {
    onConfirm({
      task,
      targetStatus,
      completedPlatforms: platformsToSave,
    });
  };

  const handleProceedAnyway = () => {
    onConfirm({
      task,
      targetStatus,
      completedPlatforms: selectedCompleted,
    });
  };

  const clientName =
    task.client?.companyName ||
    task.clientName ||
    (typeof task.client === "string" ? task.client : "Client");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#131d31] rounded-2xl shadow-2xl border border-amber-300 dark:border-amber-500/30 overflow-hidden text-slate-800 dark:text-slate-100 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Warning Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-rose-500 to-amber-500" />

        {/* Header */}
        <div className="p-5 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-inner">
                <FiAlertTriangle size={22} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Platform Post Verification Alert</span>
                </h3>
               
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Task Info Pill */}
          <div className="mt-3 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#162033] border border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs">
            <div className="truncate pr-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Task • {clientName}
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                {task.taskTitle || "Untitled Task"}
              </span>
            </div>

            <div className="shrink-0 flex items-center gap-1.5">
              <span className="text-[10.5px] text-slate-400 font-medium">Status:</span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-2xs">
                {targetStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Warning Callout Box */}
        <div className="px-5 pb-2">
          <div className="p-3 rounded-xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/90 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-amber-950 dark:text-amber-300">
              <span>⚠️</span>
              <span>All assigned platforms must be posted & ticked:</span>
            </p>
          
          </div>
        </div>

        {/* Platform Checklist Section */}
        <div className="px-5 py-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Assigned Platforms
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  isAllDone
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                    : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-700"
                }`}
              >
                {selectedCompleted.filter((p) =>
                  assignedPlatforms.some((ap) => ap.toLowerCase() === p.toLowerCase())
                ).length}
                /{assignedPlatforms.length} {isAllDone ? "✓ All Ticked" : "Pending"}
              </span>
            </div>

            {!isAllDone && (
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline cursor-pointer flex items-center gap-1"
              >
                <FiCheckCircle size={12} /> Select / Tick All
              </button>
            )}
          </div>

          {/* Grid of platform cards */}
          <div className="grid grid-cols-2 gap-2">
            {assignedPlatforms.map((platId) => {
              const platObj =
                ALL_PLATFORMS_MAP.find(
                  (p) => p.id.toLowerCase() === platId.toLowerCase()
                ) || {
                  id: platId,
                  name: platId,
                  icon: FiLayers,
                  color: "#6366f1",
                };
              const IconComp = platObj.icon;
              const done = isPlatformDone(platId);

              return (
                <div
                  key={platId}
                  onClick={() => togglePlatform(platId)}
                  className={`group relative flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                    done
                      ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700/70 text-emerald-900 dark:text-emerald-200 shadow-2xs hover:border-emerald-400"
                      : "bg-rose-50/60 dark:bg-rose-950/20 border-rose-300/80 dark:border-rose-800/60 text-slate-800 dark:text-slate-200 hover:border-rose-400"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs"
                      style={{ backgroundColor: platObj.color }}
                    >
                      <IconComp size={14} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold truncate block">
                        {platObj.name}
                      </span>
                      <span
                        className={`text-[9.5px] font-black tracking-wide block ${
                          done
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {done ? "✓ Post Podiyachu" : "⚠️ Post Podala"}
                      </span>
                    </div>
                  </div>

                  {/* Checkbox indicator */}
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all shrink-0 ml-1.5 ${
                      done
                        ? "bg-emerald-600 border-emerald-600 text-white shadow-2xs scale-105"
                        : "border-slate-300 dark:border-slate-600 bg-white dark:bg-[#131d31] text-transparent group-hover:border-emerald-400"
                    }`}
                  >
                    <FiCheck size={12} className="stroke-[3]" />
                  </div>
                </div>
              );
            })}
          </div>

          
        </div>

        {/* Footer Actions */}
        <div className="p-5 pt-3 bg-slate-50/70 dark:bg-[#162033]/60 border-t border-slate-200/80 dark:border-white/10 space-y-2">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#131d31] hover:bg-slate-100 dark:hover:bg-[#1c2942] text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {isAllDone ? (
              <button
                type="button"
                onClick={() => handleSaveWithCompleted(selectedCompleted)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-extrabold text-xs shadow-lg shadow-emerald-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <FiCheck size={16} className="stroke-[3]" />
                <span>Save & Set to "{targetStatus}"</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSaveWithCompleted(assignedPlatforms)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-extrabold text-xs shadow-lg shadow-emerald-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <FiCheckCircle size={16} />
                <span>Tick All Platforms & Set "{targetStatus}"</span>
              </button>
            )}
          </div>

          {!isAllDone && (
            <div className="text-center pt-0.5">
              <button
                type="button"
                onClick={handleProceedAnyway}
                className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline underline-offset-2 transition-colors cursor-pointer"
              >
                Proceed anyway without ticking platforms
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

