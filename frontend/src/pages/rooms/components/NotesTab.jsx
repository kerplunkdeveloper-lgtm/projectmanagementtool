import { useEffect, useRef, useState } from "react";
import { FiCheck, FiAlertTriangle, FiLock } from "react-icons/fi";
import { saveNotes, apiError } from "../../../services/roomService";
import { formatDateTime, copyText } from "../roomUtils";

const SAVE_DELAY = 1200;

const NotesTab = ({ room, onSaved, onExpired }) => {
  const remote = room.notes || { content: "", version: 0 };
  const canEdit = room.isHost || room.permissions?.membersCanEditNotes;
  const max = room.limits?.notesMaxChars || 20000;

  const [text, setText] = useState(remote.content);
  const [baseVersion, setBaseVersion] = useState(remote.version);
  const [status, setStatus] = useState("saved"); // saved | dirty | saving | conflict | error
  const [message, setMessage] = useState("");
  const timer = useRef(null);
  const textRef = useRef(text);

  // Pull in remote changes when we have nothing unsaved
  useEffect(() => {
    if (remote.version === baseVersion) return;
    if (status === "saved") {
      textRef.current = remote.content;
      setText(remote.content);
      setBaseVersion(remote.version);
    } else if (status !== "saving" && remote.version > baseVersion) {
      setStatus("conflict");
      setMessage("Someone else edited the notes while you were typing.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remote.version, remote.content]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const save = async (content, version) => {
    setStatus("saving");
    try {
      const saved = await saveNotes(room._id, content, version);
      setBaseVersion(saved.version);
      onSaved?.(saved);
      // If the user kept typing during the save, stay dirty and schedule another save
      if (textRef.current !== content) {
        setStatus("dirty");
        clearTimeout(timer.current);
        timer.current = setTimeout(() => save(textRef.current, saved.version), SAVE_DELAY);
      } else {
        setStatus("saved");
        setMessage("");
      }
    } catch (err) {
      const code = err?.response?.status;
      if (code === 410) return onExpired?.();
      if (code === 409) {
        setStatus("conflict");
        setMessage("Someone else edited the notes while you were typing.");
        return;
      }
      setStatus("error");
      setMessage(apiError(err, "Couldn't save notes."));
    }
  };

  const onChange = (e) => {
    const value = e.target.value.slice(0, max);
    textRef.current = value;
    setText(value);
    if (status === "conflict") return; // wait for the user to resolve
    setStatus("dirty");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => save(value, baseVersion), SAVE_DELAY);
  };

  const loadLatest = async () => {
    await copyText(text); // keep the user's draft on the clipboard so nothing is lost
    textRef.current = remote.content;
    setText(remote.content);
    setBaseVersion(remote.version);
    setStatus("saved");
    setMessage("Loaded the latest notes. Your draft was copied to the clipboard.");
  };

  const overwrite = () => save(text, remote.version);

  const statusLabel = {
    saved: <><FiCheck aria-hidden="true" /> Saved</>,
    dirty: "Unsaved changes…",
    saving: "Saving…",
    conflict: <><FiAlertTriangle aria-hidden="true" /> Conflict</>,
    error: <><FiAlertTriangle aria-hidden="true" /> Not saved</>,
  }[status];

  return (
    <div className="room-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <label htmlFor="room-notes" className="text-sm font-bold text-slate-800 dark:text-white">Shared notes</label>
        <span role="status" aria-live="polite" className={`inline-flex items-center gap-1 text-[11px] font-bold ${status === "saved" ? "text-emerald-600 dark:text-emerald-400" : status === "conflict" || status === "error" ? "text-rose-600 dark:text-rose-400" : "text-slate-500"}`}>
          {canEdit ? statusLabel : <><FiLock aria-hidden="true" /> Read-only</>}
        </span>
      </div>

      {status === "conflict" && (
        <div role="alert" className="mb-3 rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/20 p-3 text-xs text-amber-900 dark:text-amber-200 flex flex-wrap items-center gap-2 justify-between">
          <span>{message}</span>
          <span className="flex gap-2">
            <button type="button" className="room-btn-secondary" onClick={loadLatest}>Load latest</button>
            <button type="button" className="room-btn-primary" onClick={overwrite}>Keep mine</button>
          </span>
        </div>
      )}
      {status === "error" && (
        <div role="alert" className="mb-3 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
          {message}
          <button type="button" className="underline font-bold" onClick={() => save(text, baseVersion)}>Retry</button>
        </div>
      )}
      {status === "saved" && message && <p className="mb-2 text-xs text-slate-500">{message}</p>}

      <textarea
        id="room-notes"
        value={text}
        onChange={onChange}
        readOnly={!canEdit}
        rows={16}
        maxLength={max}
        placeholder={canEdit ? "Agenda, decisions, links, action items… Everyone in the room can see these notes." : "No notes yet."}
        className="room-input !min-h-[18rem] font-mono text-[13px] leading-relaxed resize-y"
        aria-describedby="notes-help"
      />
      <p id="notes-help" className="mt-2 flex flex-wrap justify-between gap-2 text-[11px] text-slate-400">
        <span>Saves automatically. Deleted when the room expires.</span>
        <span className="tabular-nums">
          {text.length.toLocaleString()} / {max.toLocaleString()}
          {remote.updatedAt && ` · Last edit ${formatDateTime(remote.updatedAt)}`}
        </span>
      </p>
    </div>
  );
};

export default NotesTab;
