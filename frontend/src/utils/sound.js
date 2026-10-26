// Utility for playing high-quality notification sounds
import notificationSoundFile from "../assets/notification.mp3";
import drinkWaterSoundFile from "../assets/drinkwater.mp3";

let sharedAudioCtx = null;
let lastPlayTimestamp = 0;
let userHasInteracted = false;

const getAudioContext = () => {
  if (typeof window === "undefined") return null;
  // Comply with browser autoplay policy: only initialize/resume after user gesture
  if (!userHasInteracted) return null;

  if (!sharedAudioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioCtx = new AudioContextClass();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === "suspended") {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
};

let isWaterAudioPending = false;

// Global interaction unlocker
const unlockAudio = () => {
  userHasInteracted = true;
  if (!sharedAudioCtx && typeof window !== "undefined") {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioCtx = new AudioContextClass();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === "suspended") {
    sharedAudioCtx.resume().then(() => {
      cleanupListeners();
    }).catch(() => {});
  } else if (sharedAudioCtx && sharedAudioCtx.state === "running") {
    cleanupListeners();
  }

  // If water audio was blocked by autoplay policy, start it immediately on first interaction
  if (isWaterAudioPending && waterAudio) {
    waterAudio.play().then(() => {
      isWaterAudioPending = false;
    }).catch(() => {});
  }
};

const cleanupListeners = () => {
  if (typeof window !== "undefined") {
    window.removeEventListener("click", unlockAudio);
    window.removeEventListener("keydown", unlockAudio);
    window.removeEventListener("touchstart", unlockAudio);
    window.removeEventListener("pointerdown", unlockAudio);
  }
};

if (typeof window !== "undefined") {
  window.addEventListener("click", unlockAudio, { passive: true });
  window.addEventListener("keydown", unlockAudio, { passive: true });
  window.addEventListener("touchstart", unlockAudio, { passive: true });
  window.addEventListener("pointerdown", unlockAudio, { passive: true });
}

const isSoundEnabled = () => {
  if (typeof window === "undefined") return false;
  const soundSetting = localStorage.getItem("soundEnabled");
  return soundSetting !== "false";
};

// Throttle sound calls within 150ms to prevent double-play stutter
const canPlaySoundNow = () => {
  const now = Date.now();
  if (now - lastPlayTimestamp < 150) {
    return false;
  }
  lastPlayTimestamp = now;
  return true;
};

let notificationAudio = null;

const playNotificationAudioFile = () => {
  if (typeof window === "undefined") return false;
  try {
    if (!notificationAudio) {
      notificationAudio = new Audio(notificationSoundFile);
      notificationAudio.preload = "auto";
    }
    notificationAudio.currentTime = 0;
    const playPromise = notificationAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Fallback to web audio synthesis if browser blocks audio element
        playDirectMessageSoundSynth();
      });
    }
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * Play notification.mp3 for Direct Messages
 */
export const playDirectMessageSound = () => {
  if (!isSoundEnabled() || !canPlaySoundNow()) return;

  const played = playNotificationAudioFile();
  if (!played) {
    playDirectMessageSoundSynth();
  }
};

// Web audio fallback synthesizer for direct messages
const playDirectMessageSoundSynth = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const playTone = (freq, startTime, duration, startVol, endVol, type = "sine") => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(startVol, startTime);
      gain.gain.exponentialRampToValueAtTime(endVol, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playTone(880, now, 0.35, 0.25, 0.001, "sine");
    playTone(1318.51, now + 0.08, 0.5, 0.3, 0.001, "sine");
  } catch (err) {
    console.error("Direct Message audio fallback error:", err);
  }
};

/**
 * Play notification.mp3 for Group Messages
 */
export const playGroupMessageSound = () => {
  if (!isSoundEnabled() || !canPlaySoundNow()) return;

  const played = playNotificationAudioFile();
  if (!played) {
    playGroupMessageSoundSynth();
  }
};

// Web audio fallback synthesizer for group messages
const playGroupMessageSoundSynth = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const playTone = (freq, startTime, duration, startVol, endVol, type = "sine") => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(startVol, startTime);
      gain.gain.exponentialRampToValueAtTime(endVol, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playTone(523.25, now, 0.25, 0.2, 0.001, "sine");
    playTone(783.99, now + 0.06, 0.3, 0.25, 0.001, "sine");
    playTone(1046.50, now + 0.12, 0.45, 0.28, 0.001, "sine");
  } catch (err) {
    console.error("Group Message audio fallback error:", err);
  }
};

/**
 * Task & System Notification sound chime (Exclusive for Tasks, Shoots, Client Calls, etc.)
 * Does NOT play notification.mp3 (notification.mp3 is reserved exclusively for chat messages)
 */
export const playNotificationSound = (type = "default") => {
  if (!isSoundEnabled() || !canPlaySoundNow()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const playTone = (freq, startTime, duration, vol) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(vol, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    // Crisp 3-note ascending task alert chime: C6 (1046.5Hz) -> E6 (1318.51Hz) -> G6 (1567.98Hz)
    playTone(1046.5, now, 0.35, 0.25);
    playTone(1318.51, now + 0.07, 0.4, 0.22);
    playTone(1567.98, now + 0.14, 0.55, 0.2);
  } catch (err) {
    console.error("Task Notification audio playback error:", err);
  }
};

let waterAudio = null;

/**
 * Play drinkwater.mp3 for Water Break Reminder Popup
 */
export const playWaterReminderSound = () => {
  if (typeof window === "undefined") return null;
  if (!isSoundEnabled()) return null;

  try {
    if (!waterAudio) {
      waterAudio = new Audio(drinkWaterSoundFile);
      waterAudio.preload = "auto";
      waterAudio.loop = true;
    }
    waterAudio.currentTime = 0;
    waterAudio.volume = 0.85;
    const playPromise = waterAudio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          isWaterAudioPending = false;
        })
        .catch((err) => {
          // If browser policy blocked unmuted autoplay without prior interaction, queue it
          isWaterAudioPending = true;
          console.warn("Water audio autoplay waiting for user gesture:", err);
        });
    }
    return waterAudio;
  } catch (err) {
    console.error("Water reminder audio error:", err);
    return null;
  }
};

/**
 * Stop drinkwater.mp3
 */
export const stopWaterReminderSound = () => {
  isWaterAudioPending = false;
  try {
    if (waterAudio) {
      waterAudio.pause();
      waterAudio.currentTime = 0;
    }
  } catch (err) {}
};

/**
 * Toggle mute / unmute for water audio
 */
export const toggleWaterReminderMute = (isMuted) => {
  try {
    if (waterAudio) {
      waterAudio.muted = isMuted;
    }
  } catch (err) {}
};

