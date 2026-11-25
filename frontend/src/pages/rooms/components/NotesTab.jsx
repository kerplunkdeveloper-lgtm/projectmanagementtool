import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import DiffMatchPatch from "diff-match-patch";
import { FiCheck, FiAlertTriangle, FiLock, FiWifi, FiWifiOff } from "react-icons/fi";
import { saveNotesPatch, apiError } from "../../../services/roomService";
import { useSocketContext } from "../../../context/SocketContext";
import { formatDateTime } from "../roomUtils";

const dmp = new DiffMatchPatch();
const SAVE_DELAY = 350; // ms after the last keystroke
const TYPING_EMIT_EVERY = 1500;
const TYPING_SHOW_FOR = 3500;

/**
 * Real-time shared notes (differential sync):
 * - "shadow" = the last text we know the server has (and its version).
 * - Local edits are sent as a patch from shadow -> local text; the server merges
 *   it into the current text and pushes the result to everyone.
 * - Incoming text is merged with any unsent local typing, and the caret is
 *   kept in place, so people can type at the same time.
 */
const NotesTab = ({ room, currentUserId, active, onMeta, onExpired, onPoll }) => {
  const { socket } = useSocketContext() || {};
  const remote = room.notes || { content: "", version: 0 };
  const canEdit = room.isHost || room.permissions?.membersCanEditNotes;
  const max = room.limits?.notesMaxChars || 20000;
  // Identifies this browser tab so it ignores the echo of its own saves
  const [clientId] = useState(() => crypto.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`);

  const [text, setText] = useState(remote.content);
  const [status, setStatus] = useState("saved"); // saved | dirty | saving | error
  const [message, setMessage] = useState("");
  const [live, setLive] = useState(false);
  const [typers, setTypers] = useState({}); // userId -> { name, until }

  const textareaRef = useRef(null);
  const textRef = useRef(remote.content);
  const shadowRef = useRef({ text: remote.content, version: remote.version });
  const inflightRef = useRef(null); // text that was sent, while a save is in flight
  const queueRef = useRef([]); // remote updates that arrived during a save
  const timerRef = useRef(null);
  const pendingSelRef = useRef(null);
  const lastTypingEmitRef = useRef(0);
  const blockedRef = useRef(false);
  const flushRef = useRef(null);
  const onMetaRef = useRef(onMeta);
  const onExpiredRef = useRef(onExpired);
  useEffect(() => {
    onMetaRef.current = onMeta;
    onExpiredRef.current = onExpired;
  }, [onMeta, onExpired]);

  /** Replace the textarea text while keeping the user's caret/selection in place. */
  const setLocalText = useCallback((next) => {
    const prev = textRef.current;
    if (next === prev) return;
    const el = textareaRef.current;
    if (el && document.activeElement === el) {
      const diffs = dmp.diff_main(prev, next);
      pendingSelRef.current = {
        start: dmp.diff_xIndex(diffs, el.selectionStart),
        end: dmp.diff_xIndex(diffs, el.selectionEnd),
      };
    }
    textRef.current = next;
    setText(next);
  }, []);

  useLayoutEffect(() => {
    const sel = pendingSelRef.current;
    if (sel && textareaRef.current) {
      textareaRef.current.setSelectionRange(sel.start, sel.end);
      pendingSelRef.current = null;
    }
  }, [text]);

  /** Merge a newer server text with any unsent local typing. */
  const applyRemote = useCallback(
    (payload) => {
      if (!payload || typeof payload.content !== "string") return;
      if (payload.clientId && payload.clientId === clientId) return; // our own save; handled by the response
      if (payload.version <= shadowRef.current.version) return;
      if (inflightRef.current !== null) {
        queueRef.current.push(payload);
        return;
      }
      const local = textRef.current;
      const shadow = shadowRef.current.text;
      const merged = local === shadow ? payload.content : dmp.patch_apply(dmp.patch_make(shadow, local), payload.content)[0];
      shadowRef.current = { text: payload.content, version: payload.version };
      setLocalText(merged);
      onMetaRef.current?.(payload);
    },
    [clientId, setLocalText]
  );

  const scheduleFlush = useCallback((delay = SAVE_DELAY) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => flushRef.current?.(), delay);
  }, []);

  const flush = useCallback(async () => {
    // blockedRef: last save was refused (read-only / too long); wait for the next keystroke
    if (inflightRef.current !== null || !canEdit || blockedRef.current) return;
    const sent = textRef.current;
    const shadow = shadowRef.current;
    if (sent === shadow.text) {
      setStatus("saved");
      return;
    }
    inflightRef.current = sent;
    setStatus("saving");
    let retryIn = 0;
    try {
      const patch = dmp.patch_toText(dmp.patch_make(shadow.text, sent));
      const data = await saveNotesPatch(room._id, { patch, clientId });
      if (data.version >= shadowRef.current.version) {
        const current = textRef.current;
        // Rebase anything typed while the save was in flight onto the merged server text
        const merged = current === sent ? data.content : dmp.patch_apply(dmp.patch_make(sent, current), data.content)[0];
        shadowRef.current = { text: data.content, version: data.version };
        setLocalText(merged);
        if (!data.unchanged) onMetaRef.current?.({ ...data, mine: true });
      }
      setMessage("");
    } catch (err) {
      const code = err?.response?.status;
      if (code === 410) {
        inflightRef.current = null;
        onExpiredRef.current?.();
        return;
      }
      setStatus("error");
      setMessage(
        code === 403
          ? "The host has made notes read-only."
          : code === 413
            ? apiError(err)
            : `${apiError(err, "Couldn't save.")} Retrying…`
      );
      if (code === 403 || code === 413) blockedRef.current = true;
      else retryIn = 3000;
    } finally {
      inflightRef.current = null;
    }

    // Apply remote updates that arrived during the save (older ones are already included)
    const queued = queueRef.current.sort((a, b) => a.version - b.version);
    queueRef.current = [];
    queued.forEach((p) => applyRemote(p));

    if (retryIn) scheduleFlush(retryIn);
    else if (!blockedRef.current && textRef.current !== shadowRef.current.text) scheduleFlush(0);
    else setStatus((s) => (s === "error" ? s : "saved"));
  }, [applyRemote, canEdit, clientId, room._id, scheduleFlush, setLocalText]);

  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  // Host made notes read-only: drop unsaved local text so this screen matches everyone else's
  useEffect(() => {
    if (canEdit) return;
    clearTimeout(timerRef.current);
    if (textRef.current !== shadowRef.current.text) {
      setLocalText(shadowRef.current.text);
      setStatus("saved");
    }
  }, [canEdit, setLocalText]);

  // Fallback path: notes delivered via the room API (polling / reconnects)
  useEffect(() => {
    applyRemote({ ...remote, clientId: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remote.version]);

  // Authenticated real-time channel
  useEffect(() => {
    if (!socket) return undefined;
    const subscribe = () => {
      let token;
      try {
        token = localStorage.getItem("token");
      } catch {
        token = null;
      }
      socket.emit("sorted-room:subscribe", { roomId: room._id, token }, (res) => {
        setLive(Boolean(res?.ok));
        if (res?.ok && res.notes) applyRemote({ ...res.notes, clientId: undefined });
      });
    };
    const onDisconnect = () => setLive(false);
    const onNotes = (p) => {
      if (p?.roomId === room._id) applyRemote(p);
    };
    const onTyping = (p) => {
      if (p?.roomId !== room._id || p.userId === currentUserId) return;
      setTypers((t) => ({ ...t, [p.userId]: { name: p.name, until: Date.now() + TYPING_SHOW_FOR } }));
    };

    if (socket.connected) subscribe();
    socket.on("connect", subscribe);
    socket.on("disconnect", onDisconnect);
    socket.on("sorted-room:notes", onNotes);
    socket.on("sorted-room:typing", onTyping);
    return () => {
      socket.emit("sorted-room:unsubscribe", { roomId: room._id });
      socket.off("connect", subscribe);
      socket.off("disconnect", onDisconnect);
      socket.off("sorted-room:notes", onNotes);
      socket.off("sorted-room:typing", onTyping);
    };
  }, [socket, room._id, currentUserId, applyRemote]);

  // Expire typing indicators
  useEffect(() => {
    if (!Object.keys(typers).length) return undefined;
    const t = setInterval(() => {
      const now = Date.now();
      setTypers((cur) => {
        const next = Object.fromEntries(Object.entries(cur).filter(([, v]) => v.until > now));
        return Object.keys(next).length === Object.keys(cur).length ? cur : next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [typers]);

  // Without a live connection, poll faster while the notes are on screen
  useEffect(() => {
    if (live || !active) return undefined;
    const t = setInterval(() => {
      if (document.visibilityState === "visible") onPoll?.();
    }, 5000);
    return () => clearInterval(t);
  }, [live, active, onPoll]);

  const onChange = (e) => {
    const value = e.target.value.slice(0, max);
    textRef.current = value;
    setText(value);
    blockedRef.current = false;
    setStatus("dirty");
    scheduleFlush();
    const now = Date.now();
    if (socket && live && now - lastTypingEmitRef.current > TYPING_EMIT_EVERY) {
      lastTypingEmitRef.current = now;
      socket.emit("sorted-room:typing", { roomId: room._id });
    }
  };

  // Seen / not seen for the latest update
  const editSeq = remote.editSeq || 0;
  const editorId = remote.updatedBy?._id;
  const others = room.members.filter((m) => m._id !== editorId);
  const seenBy = others.filter((m) => (m.notesSeenSeq || 0) >= editSeq);
  const notSeen = others.filter((m) => (m.notesSeenSeq || 0) < editSeq);
  const typingNames = Object.values(typers).map((t) => t.name);

  const statusLabel = {
    saved: <><FiCheck aria-hidden="true" /> Saved</>,
    dirty: "Typing…",
    saving: "Saving…",
    error: <><FiAlertTriangle aria-hidden="true" /> Not saved</>,
  }[status];

  return (
    <div className="room-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <label htmlFor="room-notes" className="text-sm font-bold text-slate-800 dark:text-white">Shared notes</label>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-bold ${live ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}
            title={live ? "Changes appear for everyone instantly" : "Live updates unavailable; refreshing every few seconds"}
          >
            {live ? <FiWifi aria-hidden="true" /> : <FiWifiOff aria-hidden="true" />} {live ? "Live" : "Offline"}
          </span>
          <span
            role="status"
            aria-live="polite"
            className={`inline-flex items-center gap-1 text-[11px] font-bold ${status === "saved" ? "text-emerald-600 dark:text-emerald-400" : status === "error" ? "text-rose-600 dark:text-rose-400" : "text-slate-500"}`}
          >
            {canEdit ? statusLabel : <><FiLock aria-hidden="true" /> Read-only</>}
          </span>
        </div>
      </div>

      {status === "error" && message && (
        <p role="alert" className="mb-2 text-xs text-rose-600 dark:text-rose-400">{message}</p>
      )}

      <div className="h-5 mb-1" aria-live="polite">
        {typingNames.length > 0 && (
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            <span className="inline-flex gap-0.5" aria-hidden="true">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
            </span>
            {typingNames.length === 1
              ? `${typingNames[0]} is typing…`
              : `${typingNames.slice(0, -1).join(", ")} and ${typingNames[typingNames.length - 1]} are typing…`}
          </p>
        )}
      </div>

      <textarea
        id="room-notes"
        ref={textareaRef}
        value={text}
        onChange={onChange}
        readOnly={!canEdit}
        rows={16}
        maxLength={max}
        placeholder={canEdit ? "Agenda, decisions, links, action items… Everyone in the room sees changes as you type." : "No notes yet."}
        className="room-input !min-h-[18rem] font-mono text-[13px] leading-relaxed resize-y"
        aria-describedby="notes-help notes-seen"
      />

      <div id="notes-seen" className="mt-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 px-3 py-2 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
        {editSeq > 0 && remote.updatedBy ? (
          <>
            <p>
              Last update by{" "}
              <span className="font-bold text-slate-700 dark:text-slate-200">
                {editorId === currentUserId ? "you" : remote.updatedBy.name || "a member"}
              </span>{" "}
              · {formatDateTime(remote.updatedAt)}
            </p>
            {others.length > 0 && (
              <p className="flex flex-wrap gap-x-3 gap-y-1">
                <span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓✓ Seen:</span>{" "}
                  {seenBy.length ? seenBy.map((m) => (m._id === currentUserId ? "You" : m.name)).join(", ") : "no one yet"}
                </span>
                {notSeen.length > 0 && (
                  <span>
                    <span className="font-bold">✓ Not seen:</span>{" "}
                    {notSeen.map((m) => (m._id === currentUserId ? "You" : m.name)).join(", ")}
                  </span>
                )}
              </p>
            )}
          </>
        ) : (
          <p>No updates yet.</p>
        )}
      </div>

      <p id="notes-help" className="mt-2 flex flex-wrap justify-between gap-2 text-[11px] text-slate-400">
        <span>Saves automatically as you type. Deleted when the room expires.</span>
        <span className="tabular-nums">
          {text.length.toLocaleString()} / {max.toLocaleString()}
        </span>
      </p>
    </div>
  );
};

export default NotesTab;
