import { useEffect, useId, useRef, useState } from "react";
import { FiX, FiCopy, FiCheck, FiUser } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { copyText, getAvatarUrl, initials } from "../roomUtils";

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Accessible modal: focus trap, Esc to close, restores focus on close. */
export const Modal = ({ open, onClose, title, description, children, size = "max-w-lg" }) => {
  const panelRef = useRef(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    const panel = panelRef.current;
    const first = panel?.querySelector("[data-autofocus]") || panel?.querySelector(FOCUSABLE);
    first?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose?.();
      }
      if (e.key === "Tab" && panel) {
        const nodes = [...panel.querySelectorAll(FOCUSABLE)];
        if (!nodes.length) return;
        const firstEl = nodes[0];
        const lastEl = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={`relative w-full ${size} max-h-[92vh] overflow-y-auto bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl`}
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-bold text-slate-800 dark:text-white">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Close dialog"
          >
            <FiX size={18} />
          </button>
        </div>
        <div className="px-5 pb-5">{children}</div>
      </div>
    </div>
  );
};

export const ConfirmDialog = ({ open, title, message, confirmLabel = "Confirm", danger, busy, onConfirm, onCancel }) => (
  <Modal open={open} onClose={busy ? undefined : onCancel} title={title} size="max-w-md">
    <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
    <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
      <button type="button" onClick={onCancel} disabled={busy} className="room-btn-secondary">
        Cancel
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={busy}
        data-autofocus
        className={danger ? "room-btn-danger" : "room-btn-primary"}
      >
        {busy ? "Working…" : confirmLabel}
      </button>
    </div>
  </Modal>
);

const AVATAR_COLORS = [
  "from-violet-500 to-indigo-600",
  "from-blue-500 to-cyan-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
];

export const Avatar = ({ user, size = "w-8 h-8 text-[11px]" }) => {
  const [err, setErr] = useState(false);
  const url = getAvatarUrl(user);
  if (!user) {
    return (
      <span className={`${size} rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 shrink-0`}>
        <FiUser size={12} />
      </span>
    );
  }
  if (url && !err) {
    return <img src={url} alt="" onError={() => setErr(true)} className={`${size} rounded-full object-cover shrink-0`} />;
  }
  const name = user.name || "User";
  const color = AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  return (
    <span
      aria-hidden="true"
      className={`${size} rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold shrink-0`}
    >
      {initials(name)}
    </span>
  );
};

export const CopyButton = ({ text, label, successMessage = "Copied", className = "room-btn-secondary", icon = true }) => {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    const ok = await copyText(text);
    if (ok) {
      setCopied(true);
      toast.success(successMessage);
      setTimeout(() => setCopied(false), 1800);
    } else {
      toast.error("Couldn't copy. Select and copy it manually.");
    }
  };
  return (
    <button type="button" onClick={onCopy} className={className} aria-label={label}>
      {icon && (copied ? <FiCheck size={14} aria-hidden="true" /> : <FiCopy size={14} aria-hidden="true" />)}
      <span>{copied ? "Copied" : label}</span>
    </button>
  );
};

export const Toggle = ({ checked, onChange, label, description, disabled }) => {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {label}
        </label>
        {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 w-10 h-6 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0B1120] disabled:opacity-50 ${
          checked ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            checked ? "translate-x-4" : ""
          }`}
        />
      </button>
    </div>
  );
};
