import { useEffect, useState } from "react";
import { FiLink, FiArrowRight, FiShield } from "react-icons/fi";
import { Modal, CopyButton } from "./RoomUI";
import { createRoom, apiError } from "../../../services/roomService";
import axiosInstance from "../../../services/axiosInstance";
import { availablePresets, buildInviteLink, formatDateTime } from "../roomUtils";

const CreateRoomModal = ({ open, onClose, config, onCreated, onOpenRoom }) => {
  const presets = availablePresets(config);
  const [name, setName] = useState("");
  const [clientLabel, setClientLabel] = useState("");
  const [minutes, setMinutes] = useState(presets[2]?.minutes || presets[0]?.minutes || 60);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);
  const [clientOptions, setClientOptions] = useState([]);

  useEffect(() => {
    if (!open) return;
    // Optional suggestions from the existing Clients API (ignored if the user lacks access)
    axiosInstance
      .get("/clients")
      .then((res) => {
        const list = (res.data?.data || []).map((c) => c.companyName || c.clientName).filter(Boolean);
        setClientOptions([...new Set(list)].sort().slice(0, 300));
      })
      .catch(() => setClientOptions([]));
  }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Give the room a name.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const room = await createRoom({ name: name.trim(), clientLabel: clientLabel.trim(), expiresInMinutes: minutes });
      setCreated(room);
      onCreated?.(room);
    } catch (err) {
      setError(apiError(err, "Could not create the room."));
    } finally {
      setBusy(false);
    }
  };

  if (created) {
    const link = buildInviteLink(created.code);
    return (
      <Modal open={open} onClose={onClose} title="Room created" description="Share the code or invite link with teammates. They'll need to sign in to Sorted to join.">
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/60 dark:bg-indigo-950/30 p-4 text-center">
          <p className="room-label !mb-1">Room code</p>
          <p className="room-code text-2xl sm:text-3xl font-extrabold text-indigo-700 dark:text-indigo-300 select-all break-all" aria-label={`Room code ${created.code.split("").join(" ")}`}>
            {created.code}
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Expires {formatDateTime(created.expiresAt)}</p>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <CopyButton text={created.code} label="Copy code" successMessage="Room code copied" />
          <CopyButton text={link} label="Copy invite link" successMessage="Invite link copied" />
        </div>
        <p className="mt-3 flex items-start gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <FiShield className="mt-0.5 shrink-0" size={12} aria-hidden="true" />
          Treat the code like a password. You can change it or lock the room at any time.
        </p>
        <div className="mt-5 flex justify-end">
          <button type="button" className="room-btn-primary" onClick={() => onOpenRoom(created._id)} data-autofocus>
            Open room <FiArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={busy ? undefined : onClose} title="Create a room" description="A temporary space for files and shared notes. Everything is deleted when it expires.">
      <form onSubmit={submit} noValidate>
        <div className="space-y-4">
          <div>
            <label htmlFor="room-name" className="room-label">
              Room name <span className="text-rose-500">*</span>
            </label>
            <input
              id="room-name"
              className="room-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              placeholder="e.g. Brand shoot review"
              required
              aria-invalid={Boolean(error && !name.trim())}
              data-autofocus
            />
          </div>
          <div>
            <label htmlFor="room-client" className="room-label">
              Client / project <span className="normal-case font-medium tracking-normal">(optional)</span>
            </label>
            <input
              id="room-client"
              className="room-input"
              value={clientLabel}
              onChange={(e) => setClientLabel(e.target.value)}
              maxLength={80}
              list="room-client-options"
              placeholder="Start typing a client or project"
            />
            <datalist id="room-client-options">
              {clientOptions.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <fieldset>
            <legend className="room-label">Expires after</legend>
            <div className="grid grid-cols-3 gap-2">
              {presets.map((p) => (
                <label
                  key={p.minutes}
                  className={`cursor-pointer text-center rounded-lg border px-2 py-2 text-xs font-bold transition-colors focus-within:ring-2 focus-within:ring-indigo-500 ${
                    minutes === p.minutes
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                      : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:text-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="room-expiry"
                    className="sr-only"
                    value={p.minutes}
                    checked={minutes === p.minutes}
                    onChange={() => setMinutes(p.minutes)}
                  />
                  {p.label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-rose-600 dark:text-rose-400">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button type="button" className="room-btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="room-btn-primary" disabled={busy}>
            <FiLink size={14} aria-hidden="true" />
            {busy ? "Creating…" : "Create room"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateRoomModal;
