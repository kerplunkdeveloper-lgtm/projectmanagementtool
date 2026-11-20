import toast from "react-hot-toast";

// Short, pleasant two-note "success" chime generated with the Web Audio API (no audio file needed)
let ctx = null;
let lastPlayed = 0;

export const playSuccessSound = () => {
  try {
    const now = Date.now();
    if (now - lastPlayed < 300) return; // avoid stacking when several toasts fire together
    lastPlayed = now;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!ctx) ctx = new AudioCtx();
    if (ctx.state === "suspended") ctx.resume();

    const start = ctx.currentTime;
    // C6 -> E6 -> G6 rising arpeggio
    [1046.5, 1318.5, 1568].forEach((freq, i) => {
      const t = start + i * 0.09;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  } catch {
    // Sound is a nice-to-have; never break the toast
  }
};

// Make every toast.success(...) in the app play the chime
let installed = false;
export const installSuccessToastSound = () => {
  if (installed) return;
  installed = true;
  const original = toast.success;
  toast.success = (...args) => {
    playSuccessSound();
    return original(...args);
  };
};
