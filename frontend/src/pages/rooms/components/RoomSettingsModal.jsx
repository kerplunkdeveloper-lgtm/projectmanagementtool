import { useState } from "react";
import { toast } from "react-hot-toast";
import { FiRefreshCw, FiTrash2 } from "react-icons/fi";
import { Modal, Toggle, ConfirmDialog } from "./RoomUI";
import { updateRoom, rotateRoomCode, endRoom, apiError } from "../../../services/roomService";
import { availablePresets } from "../roomUtils";

const RoomSettingsModal = ({ open, onClose, room, onUpdated, onEnded }) => {
  const [name, setName] = useState(room.name);
  const [clientLabel, setClientLabel] = useState(room.clientLabel || "");
  const [extend, setExtend] = useState("");
  const [busy, setBusy] = useState("");
  const [confirm, setConfirm] = useState(null); // "code" | "end"
  const presets = availablePresets(room.limits);

  const run = async (key, fn, success) => {
    setBusy(key);
    try {
      const updated = await fn();
      if (updated && updated._id) onUpdated(updated);
      if (success) toast.success(success);
      return true;
    } catch (err) {
      toast.error(apiError(err, "Could not update room"));
      return false;
    } finally {
      setBusy("");
    }
  };

  const saveDetails = (e) => {
    e.preventDefault();
    const payload = { name: name.trim(), clientLabel: clientLabel.trim() };
    if (extend) payload.expiresInMinutes = Number(extend);
    run("details", () => updateRoom(room._id, payload), "Room updated").then((ok) => ok && setExtend(""));
  };

  const setPermission = (key, value) =>
    run(key, () => updateRoom(room._id, { permissions: { [key]: value } }));

  const onConfirm = async () => {
    if (confirm === "code") {
      await run("code", () => rotateRoomCode(room._id), "New room code created. The old code no longer works.");
    } else if (confirm === "end") {
      const ok = await run("end", () => endRoom(room._id), "Room ended. All files are being deleted.");
      if (ok) {
        setConfirm(null);
        onEnded();
        return;
      }
    }
    setConfirm(null);
  };

  const confirmCopy = {
    code: {
      title: "Change the room code?",
      message: "The current code and invite link stop working immediately. Existing members stay in the room.",
      label: "Change code",
    },
    end: {
      title: "End this room for everyone?",
      message: "All files, notes and access are permanently deleted. This can't be undone.",
      label: "End room",
      danger: true,
    },
  }[confirm] || {};

  return (
    <>
      <Modal open={open && !confirm} onClose={onClose} title="Room settings" description="Only you, the host, can change these.">
        <form onSubmit={saveDetails} className="space-y-3">
          <div>
            <label htmlFor="settings-name" className="room-label">Room name</label>
            <input id="settings-name" className="room-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required />
          </div>
          <div>
            <label htmlFor="settings-client" className="room-label">Client / project</label>
            <input id="settings-client" className="room-input" value={clientLabel} onChange={(e) => setClientLabel(e.target.value)} maxLength={80} />
          </div>
          <div>
            <label htmlFor="settings-expiry" className="room-label">Change expiry</label>
            <select id="settings-expiry" className="room-input" value={extend} onChange={(e) => setExtend(e.target.value)}>
              <option value="">Keep current expiry</option>
              {presets.map((p) => (
                <option key={p.minutes} value={p.minutes}>Expire {p.label} from now</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="room-btn-primary" disabled={busy === "details" || !name.trim()}>
              {busy === "details" ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h3 className="room-label">Access</h3>
          <Toggle
            label="Lock room"
            description="No one new can join, even with the code."
            checked={room.locked}
            disabled={busy === "locked"}
            onChange={(v) => run("locked", () => updateRoom(room._id, { locked: v }), v ? "Room locked" : "Room unlocked")}
          />
          <Toggle label="Members can upload files" checked={room.permissions.membersCanUpload} disabled={busy === "membersCanUpload"} onChange={(v) => setPermission("membersCanUpload", v)} />
          <Toggle label="Members can delete their own files" checked={room.permissions.membersCanDeleteOwnFiles} disabled={busy === "membersCanDeleteOwnFiles"} onChange={(v) => setPermission("membersCanDeleteOwnFiles", v)} />
          <Toggle label="Members can edit shared notes" checked={room.permissions.membersCanEditNotes} disabled={busy === "membersCanEditNotes"} onChange={(v) => setPermission("membersCanEditNotes", v)} />
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button type="button" className="room-btn-secondary" onClick={() => setConfirm("code")}>
            <FiRefreshCw size={14} aria-hidden="true" /> Change room code
          </button>
          <button type="button" className="room-btn-danger" onClick={() => setConfirm("end")}>
            <FiTrash2 size={14} aria-hidden="true" /> End room & delete everything
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirmCopy.title}
        message={confirmCopy.message}
        confirmLabel={confirmCopy.label}
        danger={confirmCopy.danger}
        busy={Boolean(busy)}
        onConfirm={onConfirm}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
};

export default RoomSettingsModal;
