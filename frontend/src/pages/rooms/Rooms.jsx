import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FiPlus, FiLogIn, FiUsers, FiFile, FiClock, FiLock, FiRefreshCw, FiArrowRight } from "react-icons/fi";
import { LuDoorOpen } from "react-icons/lu";
import CreateRoomModal from "./components/CreateRoomModal";
import { listRooms, joinRoom, getRoomConfig, apiError } from "../../services/roomService";
import { useSocketContext } from "../../context/SocketContext";
import { PENDING_CODE_KEY, roleBasePath, useCountdown, countdownClasses, formatBytes } from "./roomUtils";
import "./rooms.css";

const RoomCard = ({ room, onOpen }) => {
  const { label, level } = useCountdown(room.expiresAt);
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(room._id)}
        className="room-card w-full text-left p-4 hover:border-indigo-300 dark:hover:border-indigo-800 hover:shadow-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 group"
        aria-label={`Open room ${room.name}, expires in ${label}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-bold text-slate-800 dark:text-white truncate">{room.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {room.clientLabel || "No client / project"} · Host: {room.isHost ? "You" : room.host?.name || "—"}
            </p>
          </div>
          <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[11px] font-bold tabular-nums ${countdownClasses[level]}`}>
            <FiClock size={11} aria-hidden="true" /> {label}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1"><FiUsers size={12} aria-hidden="true" /> {room.memberCount}</span>
          <span className="inline-flex items-center gap-1"><FiFile size={12} aria-hidden="true" /> {room.fileCount} files</span>
          {room.locked && (
            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400"><FiLock size={12} aria-hidden="true" /> Locked</span>
          )}
          {room.isHost && (
            <span className="ml-auto px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-wide">Host</span>
          )}
          <FiArrowRight className={`${room.isHost ? "" : "ml-auto"} text-slate-300 group-hover:text-indigo-500 transition`} aria-hidden="true" />
        </div>
      </button>
    </li>
  );
};

const Rooms = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const base = roleBasePath(location.pathname);
  const { socket } = useSocketContext() || {};

  const [rooms, setRooms] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const autoJoinTried = useRef(false);

  const openRoom = useCallback((id) => navigate(`${base}/rooms/${id}`), [navigate, base]);

  const load = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    try {
      const [list, cfg] = await Promise.all([listRooms(), config ? Promise.resolve(config) : getRoomConfig()]);
      setRooms(list);
      setConfig(cfg);
      setLoadError("");
    } catch (err) {
      setLoadError(apiError(err, "Could not load your rooms."));
    } finally {
      if (initial) setLoading(false);
    }
  }, [config]);

  const doJoin = useCallback(async (value) => {
    const trimmed = (value || "").trim();
    if (!trimmed) {
      setJoinError("Enter a room code.");
      return;
    }
    setJoining(true);
    setJoinError("");
    try {
      const res = await joinRoom(trimmed);
      toast.success(res.alreadyMember ? "You're already in this room" : "Joined room");
      setCode("");
      openRoom(res._id);
    } catch (err) {
      setJoinError(apiError(err, "Could not join the room."));
    } finally {
      setJoining(false);
    }
  }, [openRoom]);

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Invite link flow: code saved by /rooms/join, prefill + join once.
  useEffect(() => {
    if (autoJoinTried.current) return;
    autoJoinTried.current = true;
    let pending;
    try {
      pending = sessionStorage.getItem(PENDING_CODE_KEY);
      sessionStorage.removeItem(PENDING_CODE_KEY);
    } catch {
      pending = null;
    }
    if (pending) {
      setCode(pending);
      doJoin(pending);
    }
  }, [doJoin]);

  useEffect(() => {
    if (!socket) return undefined;
    const onChange = () => load(false);
    socket.on("sorted-room:changed", onChange);
    return () => socket.off("sorted-room:changed", onChange);
  }, [socket, load]);

  return (
    <div className="p-3 sm:p-4 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
            <LuDoorOpen size={18} aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">Sorted Rooms</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Temporary rooms for sharing files and meeting with your team.</p>
          </div>
        </div>
        <button type="button" className="room-btn-primary" onClick={() => setCreateOpen(true)}>
          <FiPlus size={15} aria-hidden="true" /> Create room
        </button>
      </div>

      {/* Join */}
      <section className="room-card p-4 mb-5" aria-labelledby="join-heading">
        <h2 id="join-heading" className="text-sm font-bold text-slate-800 dark:text-white">Join with a code</h2>
        <form
          className="mt-2 flex flex-col sm:flex-row gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            doJoin(code);
          }}
        >
          <label htmlFor="join-code" className="sr-only">Room code</label>
          <input
            id="join-code"
            className="room-input room-code uppercase sm:max-w-xs"
            placeholder="XXXX-XXXX-XXXX"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={20}
            aria-invalid={Boolean(joinError)}
            aria-describedby={joinError ? "join-error" : "join-help"}
          />
          <button type="submit" className="room-btn-secondary" disabled={joining}>
            <FiLogIn size={14} aria-hidden="true" /> {joining ? "Joining…" : "Join room"}
          </button>
        </form>
        {joinError ? (
          <p id="join-error" role="alert" className="mt-2 text-xs text-rose-600 dark:text-rose-400">{joinError}</p>
        ) : (
          <p id="join-help" className="mt-2 text-xs text-slate-500 dark:text-slate-400">Ask the room host for the 12-character code or invite link.</p>
        )}
      </section>

      {/* My rooms */}
      <section aria-labelledby="my-rooms-heading">
        <div className="flex items-center justify-between mb-2">
          <h2 id="my-rooms-heading" className="text-sm font-bold text-slate-800 dark:text-white">Your active rooms</h2>
          <button type="button" className="room-btn-ghost text-xs" onClick={() => load(false)} aria-label="Refresh rooms">
            <FiRefreshCw size={13} aria-hidden="true" />
          </button>
        </div>

        {loading ? (
          <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3" aria-busy="true" aria-label="Loading rooms">
            {[0, 1, 2].map((i) => (
              <li key={i} className="room-card p-4 animate-pulse">
                <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="mt-2 h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-800/60" />
                <div className="mt-4 h-3 w-1/3 rounded bg-slate-100 dark:bg-slate-800/60" />
              </li>
            ))}
          </ul>
        ) : loadError ? (
          <div role="alert" className="room-card p-6 text-center">
            <p className="text-sm text-rose-600 dark:text-rose-400">{loadError}</p>
            <button type="button" className="room-btn-secondary mt-3" onClick={() => load(true)}>Try again</button>
          </div>
        ) : rooms.length === 0 ? (
          <div className="room-card p-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500">
              <LuDoorOpen size={22} aria-hidden="true" />
            </div>
            <p className="mt-3 font-bold text-slate-800 dark:text-white">No active rooms</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Create a room to share files and start a call, or join one with a code from a teammate.
            </p>
            <button type="button" className="room-btn-primary mt-4" onClick={() => setCreateOpen(true)}>
              <FiPlus size={14} aria-hidden="true" /> Create room
            </button>
          </div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {rooms.map((r) => (
              <RoomCard key={r._id} room={r} onOpen={openRoom} />
            ))}
          </ul>
        )}

        {config && (
          <p className="mt-4 text-[11px] text-slate-400 dark:text-slate-500">
            Limits: up to {formatBytes(config.maxFileBytes)} per file, {formatBytes(config.maxRoomBytes)} and{" "}
            {config.maxFilesPerRoom} files per room, {config.maxMembers} members, rooms last up to {config.maxExpiryHours} hours.
          </p>
        )}
      </section>

      {createOpen && <CreateRoomModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        config={config}
        onCreated={() => load(false)}
        onOpenRoom={(id) => {
          setCreateOpen(false);
          openRoom(id);
        }}
      />}
    </div>
  );
};

export default Rooms;
