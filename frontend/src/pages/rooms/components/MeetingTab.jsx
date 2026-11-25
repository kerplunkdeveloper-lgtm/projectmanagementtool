import { useCallback, useEffect, useRef, useState } from "react";
import {
  FiMic, FiMicOff, FiVideo, FiVideoOff, FiMonitor, FiPhoneOff, FiPhone, FiAlertTriangle, FiInfo, FiExternalLink, FiCheckCircle, FiRefreshCw,
} from "react-icons/fi";

// ---- Jitsi IFrame API loader (loaded once, only when a user joins a meeting) ----
const scriptPromises = {};
const loadJitsiApi = (domain) => {
  if (window.JitsiMeetExternalAPI) return Promise.resolve(window.JitsiMeetExternalAPI);
  if (scriptPromises[domain]) return scriptPromises[domain];
  scriptPromises[domain] = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://${domain}/external_api.js`;
    s.async = true;
    s.onload = () => (window.JitsiMeetExternalAPI ? resolve(window.JitsiMeetExternalAPI) : reject(new Error("api-missing")));
    s.onerror = () => {
      delete scriptPromises[domain];
      s.remove();
      reject(new Error("script-failed"));
    };
    document.head.appendChild(s);
  });
  return scriptPromises[domain];
};

const describeMediaError = (err) => {
  switch (err?.name) {
    case "NotAllowedError":
    case "SecurityError":
      return "Access was blocked. Allow camera and microphone for this site in your browser's address bar or settings, then check again.";
    case "NotFoundError":
    case "OverconstrainedError":
      return "No camera or microphone was found. Connect a device and check again.";
    case "NotReadableError":
    case "AbortError":
      return "Your camera or microphone is being used by another app. Close it and check again.";
    default:
      return "Your browser couldn't access a camera or microphone.";
  }
};

const ControlButton = ({ on, onClick, iconOn, iconOff, labelOn, labelOff, disabled, danger, title }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title || (on ? labelOn : labelOff)}
    className={`flex flex-col items-center justify-center gap-1 min-w-[4.25rem] h-16 px-3 rounded-2xl text-[11px] font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:opacity-40 disabled:cursor-not-allowed ${
      danger
        ? "bg-rose-600 hover:bg-rose-700 text-white"
        : on
          ? "bg-white/10 hover:bg-white/20 text-white"
          : "bg-rose-500/90 hover:bg-rose-500 text-white"
    }`}
  >
    <span aria-hidden="true">{on ? iconOn : iconOff}</span>
    <span>{on ? labelOn : labelOff}</span>
  </button>
);

const MeetingTab = ({ room, user, active }) => {
  const domain = room.meeting?.domain || "meet.jit.si";
  const roomName = room.meeting?.roomName;
  const containerRef = useRef(null);
  const apiRef = useRef(null);
  const joinedNameRef = useRef(null);
  const slowTimerRef = useRef(null);

  const [phase, setPhase] = useState("idle"); // idle | loading | in-call | error
  const [error, setError] = useState("");
  const [slow, setSlow] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [participants, setParticipants] = useState(0);
  const [deviceCheck, setDeviceCheck] = useState({ status: "unknown", message: "" });
  const [linkChanged, setLinkChanged] = useState(false);

  const mediaSupported = typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);
  const screenShareSupported = typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getDisplayMedia);
  const externalUrl = roomName ? `https://${domain}/${roomName}` : "";

  const disposeApi = useCallback(() => {
    clearTimeout(slowTimerRef.current);
    try {
      apiRef.current?.dispose();
    } catch {
      /* already gone */
    }
    apiRef.current = null;
    joinedNameRef.current = null;
    setSharing(false);
    setParticipants(0);
    setSlow(false);
  }, []);

  useEffect(() => disposeApi, [disposeApi]); // leave the call if the room page unmounts

  // Host reset the meeting link while we're in the call
  useEffect(() => {
    if (joinedNameRef.current && roomName && joinedNameRef.current !== roomName) setLinkChanged(true);
  }, [roomName]);

  const checkDevices = async () => {
    if (!mediaSupported) {
      setDeviceCheck({
        status: "error",
        message: window.isSecureContext
          ? "This browser doesn't support camera or microphone access."
          : "Camera and microphone need a secure (https) connection.",
      });
      return;
    }
    setDeviceCheck({ status: "checking", message: "" });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      stream.getTracks().forEach((t) => t.stop());
      setDeviceCheck({ status: "ok", message: "Camera and microphone are ready." });
    } catch (err) {
      // Fall back to audio-only so people without a camera can still join
      try {
        const audio = await navigator.mediaDevices.getUserMedia({ audio: true });
        audio.getTracks().forEach((t) => t.stop());
        setCamOn(false);
        setDeviceCheck({ status: "partial", message: `Microphone ready. Camera unavailable: ${describeMediaError(err)}` });
      } catch (audioErr) {
        setDeviceCheck({ status: "error", message: describeMediaError(audioErr) });
      }
    }
  };

  const join = async () => {
    if (!roomName || !containerRef.current) return;
    setError("");
    setLinkChanged(false);
    setPhase("loading");
    try {
      const JitsiMeetExternalAPI = await loadJitsiApi(domain);
      disposeApi();
      containerRef.current.innerHTML = "";
      const api = new JitsiMeetExternalAPI(domain, {
        roomName,
        parentNode: containerRef.current,
        width: "100%",
        height: "100%",
        // Only the display name is shared with the meeting provider (no email / IDs).
        userInfo: { displayName: user?.name || "Sorted user" },
        configOverwrite: {
          prejoinConfig: { enabled: false },
          prejoinPageEnabled: false,
          startWithAudioMuted: !micOn,
          startWithVideoMuted: !camOn,
          disableDeepLinking: true,
          subject: "Sorted meeting", // generic; never the room or client name
          toolbarButtons: ["microphone", "camera", "desktop", "chat", "raisehand", "tileview", "participants-pane", "settings", "fullscreen", "hangup"],
        },
        interfaceConfigOverwrite: { MOBILE_APP_PROMO: false },
      });
      apiRef.current = api;
      joinedNameRef.current = roomName;

      clearTimeout(slowTimerRef.current);
      slowTimerRef.current = setTimeout(() => setSlow(true), 25000);

      api.addListener("videoConferenceJoined", () => {
        clearTimeout(slowTimerRef.current);
        setSlow(false);
        setPhase("in-call");
        setParticipants(api.getNumberOfParticipants?.() || 1);
      });
      api.addListener("participantJoined", () => setParticipants(api.getNumberOfParticipants?.() || 0));
      api.addListener("participantLeft", () => setParticipants(api.getNumberOfParticipants?.() || 0));
      api.addListener("audioMuteStatusChanged", ({ muted }) => setMicOn(!muted));
      api.addListener("videoMuteStatusChanged", ({ muted }) => setCamOn(!muted));
      api.addListener("screenSharingStatusChanged", ({ on }) => setSharing(Boolean(on)));
      api.addListener("cameraError", ({ message }) => setError(`Camera problem: ${message || "camera unavailable"}. You can continue with audio.`));
      api.addListener("micError", ({ message }) => setError(`Microphone problem: ${message || "microphone unavailable"}.`));
      api.addListener("errorOccurred", ({ error: e }) => {
        if (e?.isFatal) {
          setError("The meeting connection was lost. Check your network and rejoin.");
          disposeApi();
          setPhase("error");
        }
      });
      api.addListener("readyToClose", () => {
        disposeApi();
        setPhase("idle");
      });
      // Treat as "connecting" until the conference is joined (user may be on the provider's sign-in screen)
      setPhase((p) => (p === "loading" ? "in-call-connecting" : p));
    } catch (err) {
      disposeApi();
      setPhase("error");
      setError(
        err?.message === "script-failed"
          ? `Couldn't reach ${domain}. Your network or an ad/content blocker may be blocking it.`
          : "The meeting couldn't start. Please try again."
      );
    }
  };

  const leave = () => {
    try {
      apiRef.current?.executeCommand("hangup");
    } catch {
      /* ignore */
    }
    disposeApi();
    setPhase("idle");
  };

  const toggle = (cmd) => {
    try {
      apiRef.current?.executeCommand(cmd);
    } catch {
      setError("That control isn't available right now.");
    }
  };

  const inCall = phase === "in-call" || phase === "in-call-connecting";

  return (
    <div className="space-y-4">
      {/* Provider notice: Sorted access ≠ meeting access */}
      <div className="rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/20 p-3.5 text-xs text-amber-900 dark:text-amber-200" role="note">
        <div className="flex gap-2">
          <FiInfo className="mt-0.5 shrink-0" size={14} aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-bold">Meetings run on the public Jitsi Meet service ({domain}), not on Sorted.</p>
            <p>
              Sorted controls who can see this room, its files and notes. It <strong>can't</strong> control who joins the meeting.
              Anyone who gets the meeting link can join. The link is long and random, but meetings are <strong>not</strong> end-to-end
              private, so avoid sharing highly confidential information on calls.
            </p>
            <p>The first person to start the meeting may be asked by {domain} to sign in (for example with Google or GitHub). Others can join as guests.</p>
            {room.isHost && <p>If the meeting link leaks, use <em>Reset meeting link</em> in room settings.</p>}
          </div>
        </div>
      </div>

      {linkChanged && (
        <div role="alert" className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30 p-3 text-xs text-indigo-800 dark:text-indigo-200 flex flex-wrap items-center gap-2 justify-between">
          <span>The host reset the meeting link. Rejoin to move to the new meeting.</span>
          <button type="button" className="room-btn-primary" onClick={join}>
            <FiRefreshCw size={13} aria-hidden="true" /> Rejoin
          </button>
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/20 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
          <FiAlertTriangle className="mt-0.5 shrink-0" size={14} aria-hidden="true" />
          <span className="flex-1">{error}</span>
          <button type="button" className="font-bold underline" onClick={() => setError("")}>Dismiss</button>
        </div>
      )}

      {/* Pre-join */}
      {!inCall && phase !== "loading" && (
        <div className="room-card p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Voice & video meeting</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Join with your microphone and camera, and share your screen when you need to.
              </p>
            </div>
            <button type="button" className="room-btn-primary !h-11 !px-5" onClick={join} disabled={!roomName}>
              <FiPhone size={15} aria-hidden="true" /> {phase === "error" ? "Try again" : "Start or join meeting"}
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setMicOn((v) => !v)}
              aria-pressed={micOn}
              className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${micOn ? "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200" : "border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 bg-rose-50/60 dark:bg-rose-950/20"}`}
            >
              {micOn ? <FiMic aria-hidden="true" /> : <FiMicOff aria-hidden="true" />} {micOn ? "Join with mic on" : "Join muted"}
            </button>
            <button
              type="button"
              onClick={() => setCamOn((v) => !v)}
              aria-pressed={camOn}
              className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${camOn ? "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200" : "border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 bg-rose-50/60 dark:bg-rose-950/20"}`}
            >
              {camOn ? <FiVideo aria-hidden="true" /> : <FiVideoOff aria-hidden="true" />} {camOn ? "Join with camera on" : "Join with camera off"}
            </button>
            <button
              type="button"
              onClick={checkDevices}
              disabled={deviceCheck.status === "checking"}
              className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-800/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <FiCheckCircle aria-hidden="true" /> {deviceCheck.status === "checking" ? "Checking…" : "Check camera & mic"}
            </button>
          </div>
          {deviceCheck.message && (
            <p
              role="status"
              className={`mt-3 text-xs ${deviceCheck.status === "ok" ? "text-emerald-600 dark:text-emerald-400" : deviceCheck.status === "partial" ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"}`}
            >
              {deviceCheck.message}
            </p>
          )}
          {!screenShareSupported && (
            <p className="mt-2 text-[11px] text-slate-400">Screen sharing isn't supported in this browser (most mobile browsers can't share their screen).</p>
          )}
          {externalUrl && (
            <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              Having trouble? Open the meeting in a new tab <FiExternalLink size={12} aria-hidden="true" />
            </a>
          )}
        </div>
      )}

      {/* Call surface (kept mounted while in call) */}
      <div className={inCall || phase === "loading" ? "block" : "hidden"}>
        <div className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between px-4 py-2 text-xs text-slate-300 border-b border-white/5">
            <span className="inline-flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${phase === "in-call" ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} aria-hidden="true" />
              {phase === "in-call" ? `Live · ${participants} in call` : "Connecting…"}
            </span>
            {sharing && <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 font-bold">You're sharing your screen</span>}
          </div>
          <div ref={containerRef} className="w-full h-[58vh] min-h-[320px] sm:h-[62vh]" aria-label="Meeting video" />
          {slow && phase !== "in-call" && (
            <p role="status" className="px-4 py-2 text-[11px] text-amber-200 bg-amber-500/10">
              Still connecting. {domain} may be asking you to sign in inside the window above, or your network may block video calls.{" "}
              <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="underline font-bold">Open in a new tab</a>
            </p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 p-3 bg-slate-950/60" role="toolbar" aria-label="Meeting controls">
            <ControlButton on={micOn} onClick={() => toggle("toggleAudio")} iconOn={<FiMic size={18} />} iconOff={<FiMicOff size={18} />} labelOn="Mute" labelOff="Unmute" disabled={phase !== "in-call"} />
            <ControlButton on={camOn} onClick={() => toggle("toggleVideo")} iconOn={<FiVideo size={18} />} iconOff={<FiVideoOff size={18} />} labelOn="Stop video" labelOff="Start video" disabled={phase !== "in-call"} />
            <ControlButton
              on={!sharing}
              onClick={() => toggle("toggleShareScreen")}
              iconOn={<FiMonitor size={18} />}
              iconOff={<FiMonitor size={18} />}
              labelOn="Share screen"
              labelOff="Stop sharing"
              disabled={phase !== "in-call" || !screenShareSupported}
              title={screenShareSupported ? undefined : "Screen sharing isn't supported in this browser"}
            />
            <ControlButton danger on onClick={leave} iconOn={<FiPhoneOff size={18} />} labelOn="Leave" />
          </div>
        </div>
        {!active && inCall && <span className="sr-only">Meeting continues in the background.</span>}
      </div>
    </div>
  );
};

export default MeetingTab;
