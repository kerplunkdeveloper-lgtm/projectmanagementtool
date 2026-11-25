import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { FiArrowLeft, FiClock, FiLock, FiSettings, FiLogOut, FiFile, FiEdit3, FiAlertCircle, FiRefreshCw } from "react-icons/fi";
import { LuDoorClosed } from "react-icons/lu";
import { getRoom, leaveRoom, markNotesSeen, apiError } from "../../services/roomService";
import { useSocketContext } from "../../context/SocketContext";
import { CopyButton, ConfirmDialog } from "./components/RoomUI";
import FilesTab from "./components/FilesTab";
import NotesTab from "./components/NotesTab";
import MembersPanel from "./components/MembersPanel";
import RoomSettingsModal from "./components/RoomSettingsModal";
import { roleBasePath, useCountdown, countdownClasses, buildInviteLink, formatDateTime } from "./roomUtils";
import "./rooms.css";

const TABS = [
  { id: "files", label: "Files", icon: FiFile },
  { id: "notes", label: "Shared Notes", icon: FiEdit3 },
];

const StatePanel = ({ icon: Icon, title, message, action }) => (
  <div className="p-3 sm:p-4 max-w-xl mx-auto">
    <div className="room-card p-8 text-center mt-6" role="alert">
      <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
        <Icon size={22} aria-hidden="true" />
      </div>
      <h1 className="mt-3 text-lg font-bold text-slate-800 dark:text-white">{title}</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{message}</p>
      <div className="mt-5">{action}</div>
    </div>
  </div>
);

const RoomDetail = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const base = roleBasePath(location.pathname);
  const { user } = useSelector((s) => s.auth);
  const currentUserId = (user?._id || user?.id || "").toString();
  const { socket } = useSocketContext() || {};

  const [room, setRoom] = useState(null);
  const [state, setState] = useState("loading"); // loading | ready | expired | missing | error
  const [error, setError] = useState("");
  const [tab, setTab] = useState("files");
  const [filesRefresh, setFilesRefresh] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const tabRefs = useRef({});

  const { label: countdown, level, remaining } = useCountdown(room?.expiresAt);

  const load = useCallback(async (initial = false) => {
    if (initial) setState("loading");
    try {
      const data = await getRoom(roomId);
      // A slow background refresh must not roll back newer live notes / seen state
      setRoom((prev) => {
        if (!prev || prev._id !== data._id || (prev.notes?.version || 0) <= (data.notes?.version || 0)) return data;
        const mine = prev.members.find((m) => m._id === currentUserId);
        return {
          ...data,
          notes: prev.notes,
          members: data.members.map((m) =>
            m._id === currentUserId ? { ...m, notesSeenSeq: Math.max(m.notesSeenSeq || 0, mine?.notesSeenSeq || 0) } : m
          ),
        };
      });
      setState("ready");
    } catch (err) {
      const code = err?.response?.status;
      if (code === 410) setState("expired");
      else if (code === 404) setState("missing");
      else if (initial) {
        setError(apiError(err, "Could not load the room."));
        setState("error");
      }
    }
  }, [roomId, currentUserId]);

  useEffect(() => {
    load(true);
  }, [load]);

  // Real-time pings (content-free) + polling fallback
  useEffect(() => {
    if (!socket) return undefined;
    const onChange = ({ roomId: changed, kind }) => {
      if (changed !== roomId) return;
      if (kind === "ended") {
        setState("expired");
        return;
      }
      if (kind === "files") setFilesRefresh((n) => n + 1);
      if (kind === "notes") return; // content + counts arrive via the notes channel
      load(false);
    };
    socket.on("sorted-room:changed", onChange);
    return () => socket.off("sorted-room:changed", onChange);
  }, [socket, roomId, load]);

  useEffect(() => {
    if (state !== "ready") return undefined;
    const t = setInterval(() => {
      if (document.visibilityState === "visible") load(false);
    }, 30000);
    return () => clearInterval(t);
  }, [state, load]);

  // Countdown hit zero: show expired (the server enforces expiry independently)
  const view = state === "ready" && room && remaining <= 0 ? "expired" : state;

  const onExpired = useCallback(() => setState("expired"), []);
  const pollRoom = useCallback(() => load(false), [load]);

  // Notes updates (from the live channel or our own saves): update counts without refetching
  const onNotesMeta = useCallback(
    (p) => {
      setRoom((r) => {
        if (!r || (p.version ?? 0) < (r.notes?.version ?? 0)) return r;
        const notes = {
          ...r.notes,
          content: p.content ?? r.notes.content,
          version: p.version ?? r.notes.version,
          editSeq: p.editSeq ?? r.notes.editSeq,
          updatedAt: p.updatedAt ?? r.notes.updatedAt,
          updatedBy: p.updatedBy && typeof p.updatedBy === "object" ? p.updatedBy : r.notes.updatedBy,
        };
        const mine = p.mine || p.updatedBy?._id === currentUserId;
        const members = mine
          ? r.members.map((m) => (m._id === currentUserId ? { ...m, notesSeenSeq: notes.editSeq } : m))
          : r.members;
        return { ...r, notes, members };
      });
    },
    [currentUserId]
  );

  // Unread notes updates for me (WhatsApp-style badge)
  const myMember = room?.members?.find((m) => m._id === currentUserId);
  const notesUnread = Math.max(0, (room?.notes?.editSeq || 0) - (myMember?.notesSeenSeq || 0));

  const [pageVisible, setPageVisible] = useState(() => document.visibilityState === "visible");
  useEffect(() => {
    const onVis = () => setPageVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Viewing the notes tab marks updates as seen
  const latestSeq = room?.notes?.editSeq || 0;
  useEffect(() => {
    if (tab !== "notes" || !pageVisible || notesUnread <= 0) return undefined;
    const t = setTimeout(async () => {
      try {
        await markNotesSeen(roomId, latestSeq);
        setRoom((r) =>
          r ? { ...r, members: r.members.map((m) => (m._id === currentUserId ? { ...m, notesSeenSeq: Math.max(m.notesSeenSeq || 0, latestSeq) } : m)) } : r
        );
      } catch {
        /* will retry on the next change */
      }
    }, 800);
    return () => clearTimeout(t);
  }, [tab, pageVisible, notesUnread, latestSeq, roomId, currentUserId]);

  // Browser tab title shows unseen notes updates
  useEffect(() => {
    if (!room) return undefined;
    const original = document.title;
    if (notesUnread > 0) document.title = `(${notesUnread}) ${room.name} · Sorted Rooms`;
    return () => {
      document.title = original;
    };
  }, [notesUnread, room?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  const onTabKey = (e, index) => {
    let next = null;
    if (e.key === "ArrowRight") next = (index + 1) % TABS.length;
    if (e.key === "ArrowLeft") next = (index - 1 + TABS.length) % TABS.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = TABS.length - 1;
    if (next !== null) {
      e.preventDefault();
      setTab(TABS[next].id);
      tabRefs.current[TABS[next].id]?.focus();
    }
  };

  const doLeave = async () => {
    setLeaving(true);
    try {
      await leaveRoom(roomId);
      toast.success("You left the room");
      navigate(`${base}/rooms`);
    } catch (err) {
      toast.error(apiError(err, "Could not leave the room"));
      setLeaving(false);
    }
  };

  const backButton = (
    <Link to={`${base}/rooms`} className="room-btn-secondary">
      <FiArrowLeft size={14} aria-hidden="true" /> Back to rooms
    </Link>
  );

  if (view === "loading") {
    return (
      <div className="p-3 sm:p-4 max-w-7xl mx-auto" aria-busy="true" aria-label="Loading room">
        <div className="room-card p-5 animate-pulse">
          <div className="h-5 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="mt-3 h-8 w-1/2 rounded bg-slate-100 dark:bg-slate-800/60" />
        </div>
        <div className="mt-4 grid lg:grid-cols-[1fr_300px] gap-4">
          <div className="room-card h-72 animate-pulse" />
          <div className="room-card h-72 animate-pulse" />
        </div>
      </div>
    );
  }
  if (view === "expired") {
    return <StatePanel icon={LuDoorClosed} title="This room has ended" message="The room expired or the host ended it. Its files and notes have been or are being permanently deleted." action={backButton} />;
  }
  if (view === "missing") {
    return <StatePanel icon={FiLock} title="Room not available" message="This room doesn't exist, or you're not a member. Ask the host for a code to join." action={backButton} />;
  }
  if (view === "error" || !room) {
    return (
      <StatePanel
        icon={FiAlertCircle}
        title="Couldn't load the room"
        message={error}
        action={
          <div className="flex justify-center gap-2">
            {backButton}
            <button type="button" className="room-btn-primary" onClick={() => load(true)}>
              <FiRefreshCw size={14} aria-hidden="true" /> Retry
            </button>
          </div>
        }
      />
    );
  }

  const inviteLink = buildInviteLink(room.code);

  return (
    <div className="p-3 sm:p-4 max-w-7xl mx-auto">
      <Link to={`${base}/rooms`} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 mb-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded">
        <FiArrowLeft size={12} aria-hidden="true" /> All rooms
      </Link>

      {/* Header */}
      <header className="room-card p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white truncate">{room.name}</h1>
              {room.isHost && (
                <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-wide">You're the host</span>
              )}
              {room.locked && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wide">
                  <FiLock size={10} aria-hidden="true" /> Locked
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {room.clientLabel ? <span className="font-semibold text-slate-600 dark:text-slate-300">{room.clientLabel}</span> : "No client / project"}
              {" · "}Expires {formatDateTime(room.expiresAt)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 h-9 rounded-full border text-xs font-bold tabular-nums ${countdownClasses[level]}`}
              role="timer"
              aria-label={`Room expires in ${countdown}`}
            >
              <FiClock size={13} aria-hidden="true" /> {countdown} left
            </span>
            {room.isHost ? (
              <button type="button" className="room-btn-secondary" onClick={() => setSettingsOpen(true)}>
                <FiSettings size={14} aria-hidden="true" /> Settings
              </button>
            ) : (
              <button type="button" className="room-btn-secondary" onClick={() => setConfirmLeave(true)}>
                <FiLogOut size={14} aria-hidden="true" /> Leave
              </button>
            )}
          </div>
        </div>

        {/* Code + invite */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-3">
          <div className="min-w-0">
            <p className="room-label !mb-0.5">Room code</p>
            <p className="room-code text-lg sm:text-xl font-extrabold text-indigo-700 dark:text-indigo-300 select-all break-all">{room.code}</p>
          </div>
          <div className="sm:ml-auto grid grid-cols-2 gap-2">
            <CopyButton text={room.code} label="Copy code" successMessage="Room code copied" />
            <CopyButton text={inviteLink} label="Copy invite link" successMessage="Invite link copied" />
          </div>
        </div>
        {level === "critical" && (
          <p role="status" className="mt-3 text-xs font-semibold text-rose-600 dark:text-rose-400">
            This room expires soon. Download anything you need to keep.{room.isHost && " You can extend it in Settings."}
          </p>
        )}
      </header>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-4">
        <div className="min-w-0">
          {/* Tabs */}
          <div role="tablist" aria-label="Room sections" className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 mb-4 overflow-x-auto">
            {TABS.map((t, i) => {
              const selected = tab === t.id;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  ref={(el) => (tabRefs.current[t.id] = el)}
                  role="tab"
                  id={`room-tab-${t.id}`}
                  aria-selected={selected}
                  aria-controls={`room-panel-${t.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setTab(t.id)}
                  onKeyDown={(e) => onTabKey(e, i)}
                  className={`flex-1 min-w-[6.5rem] inline-flex items-center justify-center gap-1.5 h-9 rounded-lg text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    selected
                      ? "bg-white dark:bg-[#0B1120] text-indigo-600 dark:text-indigo-300 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  <Icon size={14} aria-hidden="true" /> {t.label}
                  {t.id === "notes" && notesUnread > 0 && (
                    <span
                      className="ml-0.5 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold leading-5 text-center"
                      aria-label={`${notesUnread} unseen notes ${notesUnread === 1 ? "update" : "updates"}`}
                    >
                      {notesUnread > 99 ? "99+" : notesUnread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Panels stay mounted so an ongoing call or upload survives tab switches */}
          <div role="tabpanel" id="room-panel-files" aria-labelledby="room-tab-files" hidden={tab !== "files"} tabIndex={0}>
            <FilesTab room={room} refreshKey={filesRefresh} onStorageChange={() => load(false)} onExpired={onExpired} />
          </div>
          <div role="tabpanel" id="room-panel-notes" aria-labelledby="room-tab-notes" hidden={tab !== "notes"} tabIndex={0}>
            <NotesTab
              room={room}
              currentUserId={currentUserId}
              active={tab === "notes"}
              onExpired={onExpired}
              onMeta={onNotesMeta}
              onPoll={pollRoom}
            />
          </div>
        </div>

        <aside className="space-y-4">
          <MembersPanel room={room} currentUserId={currentUserId} onChanged={() => load(false)} />
          <div className="room-card p-4 text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5">
            <p className="font-bold text-slate-700 dark:text-slate-200 text-xs">About this room</p>
            <p>Only signed-in Sorted members of this room can see its files and notes. Files are stored privately and links to them expire after a couple of minutes.</p>
            <p>When the room expires, everything in it is deleted automatically.</p>
          </div>
        </aside>
      </div>

      {room.isHost && settingsOpen && (
        <RoomSettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          room={room}
          onUpdated={(updated) => setRoom(updated)}
          onEnded={() => {
            setSettingsOpen(false);
            navigate(`${base}/rooms`);
          }}
        />
      )}

      <ConfirmDialog
        open={confirmLeave}
        title="Leave this room?"
        message="You'll lose access to its files and notes. You can rejoin later with the room code unless the room is locked."
        confirmLabel="Leave room"
        danger
        busy={leaving}
        onConfirm={doLeave}
        onCancel={() => setConfirmLeave(false)}
      />
    </div>
  );
};

export default RoomDetail;
