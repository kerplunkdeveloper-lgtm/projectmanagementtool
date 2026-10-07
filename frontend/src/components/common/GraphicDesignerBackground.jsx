import React, { useState, useEffect, memo } from "react";
import { LuPalette, LuCompass, LuSparkles, LuLayers } from "react-icons/lu";
import { TbVectorBezier2, TbArtboard, TbRuler2 } from "react-icons/tb";

/**
 * GraphicDesignerBackground
 * Ultra-Premium, Dynamic Graphic Designer Canvas Background.
 *
 * Includes 3 Curated Visual Themes:
 * 1. "aurora" (default): Luminous liquid holographic mesh glows, glowing bezier curves, neon anchor nodes.
 * 2. "blueprint": Architectural crosshair grid, 3D isometric wireframe cube, CAD coordinates & rulers.
 * 3. "minimal": Swiss design artboard, precision dot matrix, CMYK calibration strip & prepress crop marks.
 */
const GraphicDesignerBackground = () => {
  const [preset, setPreset] = useState(() => {
    return localStorage.getItem("designer_bg_preset") || "aurora";
  });

  const [showControls, setShowControls] = useState(false);

  const handleSelectPreset = (newPreset) => {
    setPreset(newPreset);
    localStorage.setItem("designer_bg_preset", newPreset);
  };

  return (
    <>
      {/* SCOPED KEYFRAME ANIMATIONS */}
      <style>{`
        @keyframes designer-aurora-1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); opacity: 0.65; }
          50% { transform: translate(50px, -35px) scale(1.12); opacity: 0.85; }
        }
        @keyframes designer-aurora-2 {
          0%, 100% { transform: translate(0px, 0px) scale(1); opacity: 0.6; }
          50% { transform: translate(-45px, 40px) scale(1.18); opacity: 0.8; }
        }
        @keyframes designer-aurora-3 {
          0%, 100% { transform: translate(0px, 0px) scale(1); opacity: 0.5; }
          50% { transform: translate(35px, 30px) scale(1.08); opacity: 0.75; }
        }
        @keyframes designer-path-flow {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: 80; }
        }
        @keyframes designer-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>

      {/* BACKGROUND ROOT CONTAINER */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute inset-0 -z-0 overflow-hidden"
      >
        {/* ========================================================
            PRESET 1: "AURORA" (Luminous Liquid Holographic Studio)
           ======================================================== */}
        {preset === "aurora" && (
          <>
            {/* Liquid Prismatic Glowing Meshes */}
            <div
              className="absolute -top-40 -right-20 w-[550px] h-[550px] rounded-full blur-[90px] pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(168, 85, 247, 0.22) 0%, rgba(236, 72, 153, 0.16) 40%, rgba(99, 102, 241, 0.08) 70%, transparent 100%)",
                animation: "designer-aurora-1 16s ease-in-out infinite",
              }}
            />
            <div
              className="absolute top-1/4 -left-32 w-[600px] h-[600px] rounded-full blur-[100px] pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(6, 182, 212, 0.20) 0%, rgba(59, 130, 246, 0.14) 45%, rgba(139, 92, 246, 0.08) 75%, transparent 100%)",
                animation: "designer-aurora-2 20s ease-in-out infinite",
              }}
            />
            <div
              className="absolute -bottom-36 right-1/4 w-[500px] h-[500px] rounded-full blur-[85px] pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(236, 72, 153, 0.18) 0%, rgba(139, 92, 246, 0.12) 50%, transparent 100%)",
                animation: "designer-aurora-3 18s ease-in-out infinite",
              }}
            />

            {/* Glowing Studio Mesh SVG Pattern */}
            <svg
              className="absolute inset-0 w-full h-full opacity-40 dark:opacity-30"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern
                  id="aurora-dot-grid"
                  width="36"
                  height="36"
                  patternUnits="userSpaceOnUse"
                >
                  <circle
                    cx="18"
                    cy="18"
                    r="1.2"
                    className="fill-indigo-400/40 dark:fill-indigo-300/30"
                  />
                </pattern>
                <linearGradient
                  id="aurora-neon-1"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.7" />
                  <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity="0.7" />
                </linearGradient>
                <linearGradient
                  id="aurora-neon-2"
                  x1="100%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.6" />
                  <stop offset="60%" stopColor="#6366f1" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.5" />
                </linearGradient>
                <filter
                  id="aurora-glow"
                  x="-20%"
                  y="-20%"
                  width="140%"
                  height="140%"
                >
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <rect width="100%" height="100%" fill="url(#aurora-dot-grid)" />
            </svg>

            {/* Flowing Luminous Bezier Path */}
            <svg
              className="absolute inset-0 w-full h-full opacity-70 dark:opacity-50"
              viewBox="0 0 1600 900"
              preserveAspectRatio="xMidYMid slice"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Main Glowing Stream */}
              <path
                d="M 50 780 C 350 720, 520 480, 820 430 C 1120 380, 1300 200, 1550 140"
                fill="none"
                stroke="url(#aurora-neon-1)"
                strokeWidth="2.5"
                filter="url(#aurora-glow)"
                style={{
                  strokeDasharray: "8 10",
                  animation: "designer-path-flow 25s linear infinite",
                }}
              />
              <path
                d="M 90 240 C 380 180, 580 340, 880 290 C 1180 240, 1360 480, 1580 540"
                fill="none"
                stroke="url(#aurora-neon-2)"
                strokeWidth="1.8"
                opacity="0.8"
              />

              {/* Anchor Node 1: Glowing Violet Diamond */}
              <g transform="translate(820, 430)">
                <line
                  x1="-90"
                  y1="28"
                  x2="90"
                  y2="-28"
                  stroke="#a855f7"
                  strokeWidth="1.5"
                  strokeDasharray="3 4"
                  opacity="0.9"
                />
                <circle cx="-90" cy="28" r="4" fill="#06b6d4" />
                <circle cx="90" cy="-28" r="4" fill="#ec4899" />
                <rect
                  x="-6"
                  y="-6"
                  width="12"
                  height="12"
                  rx="2.5"
                  fill="#ffffff"
                  stroke="#8b5cf6"
                  strokeWidth="2.5"
                  filter="url(#aurora-glow)"
                />
              </g>

              {/* Anchor Node 2 with Pen Cursor */}
              <g transform="translate(880, 290)">
                <line
                  x1="-70"
                  y1="-22"
                  x2="70"
                  y2="22"
                  stroke="#06b6d4"
                  strokeWidth="1.5"
                  strokeDasharray="3 4"
                />
                <circle cx="-70" cy="-22" r="3.5" fill="#06b6d4" />
                <circle cx="70" cy="22" r="3.5" fill="#f43f5e" />
                <rect
                  x="-5"
                  y="-5"
                  width="10"
                  height="10"
                  rx="2"
                  fill="#ffffff"
                  stroke="#06b6d4"
                  strokeWidth="2"
                />
                {/* Pen tool nib */}
                <g transform="translate(18, -26) rotate(-35)">
                  <path
                    d="M 0 0 L 14 -14 L 22 -10 L 18 4 Z"
                    fill="#6366f1"
                    opacity="0.9"
                  />
                  <path
                    d="M 14 -14 L 26 -26 L 30 -22 L 22 -10 Z"
                    fill="#8b5cf6"
                    opacity="0.8"
                  />
                  <circle cx="12" cy="-4" r="1.8" fill="#ffffff" />
                  <line
                    x1="0"
                    y1="0"
                    x2="8"
                    y2="-4"
                    stroke="#ffffff"
                    strokeWidth="1.2"
                  />
                </g>
              </g>
            </svg>
          </>
        )}

        {/* ========================================================
            PRESET 2: "BLUEPRINT" (Architectural CAD & Figma Grid)
           ======================================================== */}
        {preset === "blueprint" && (
          <>
            {/* Deep Technical Blueprint Ambient Backing */}
            <div className="absolute inset-0 bg-radial from-indigo-500/8 via-sky-500/5 to-transparent pointer-events-none" />

            {/* Precision Crosshair Grid */}
            <svg
              className="absolute inset-0 w-full h-full opacity-45 dark:opacity-30"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern
                  id="blueprint-grid-small"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <line
                    x1="0"
                    y1="20"
                    x2="20"
                    y2="20"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    className="text-slate-300/40 dark:text-cyan-500/10"
                  />
                  <line
                    x1="20"
                    y1="0"
                    x2="20"
                    y2="20"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    className="text-slate-300/40 dark:text-cyan-500/10"
                  />
                </pattern>
                <pattern
                  id="blueprint-grid-large"
                  width="100"
                  height="100"
                  patternUnits="userSpaceOnUse"
                >
                  <rect
                    width="100"
                    height="100"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-slate-400/50 dark:text-cyan-400/20"
                  />
                  {/* Crosshair target at corners */}
                  <line
                    x1="95"
                    y1="100"
                    x2="105"
                    y2="100"
                    stroke="#0ea5e9"
                    strokeWidth="1"
                  />
                  <line
                    x1="100"
                    y1="95"
                    x2="100"
                    y2="105"
                    stroke="#0ea5e9"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill="url(#blueprint-grid-small)"
              />
              <rect
                width="100%"
                height="100%"
                fill="url(#blueprint-grid-large)"
              />
            </svg>

            {/* 3D Isometric Wireframe Cube & Golden Ratio Spiral */}
            <svg
              className="absolute inset-0 w-full h-full opacity-60 dark:opacity-35"
              viewBox="0 0 1600 900"
              preserveAspectRatio="xMidYMid slice"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Isometric 3D Wireframe Cube (Top-Right) */}
              <g
                transform="translate(1320, 160) scale(0.9)"
                stroke="#0ea5e9"
                strokeWidth="1.5"
                fill="none"
              >
                {/* Top face */}
                <polygon
                  points="0,-40 60,-10 0,20 -60,-10"
                  fill="rgba(14, 165, 233, 0.05)"
                />
                {/* Left face */}
                <polygon
                  points="-60,-10 0,20 0,85 -60,55"
                  fill="rgba(14, 165, 233, 0.08)"
                />
                {/* Right face */}
                <polygon
                  points="0,20 60,-10 60,55 0,85"
                  fill="rgba(14, 165, 233, 0.12)"
                />
                {/* Vertex points */}
                <circle cx="0" cy="-40" r="3" fill="#38bdf8" />
                <circle cx="60" cy="-10" r="3" fill="#38bdf8" />
                <circle cx="-60" cy="-10" r="3" fill="#38bdf8" />
                <circle cx="0" cy="20" r="3.5" fill="#ffffff" />
                <circle cx="0" cy="85" r="3" fill="#38bdf8" />
                <circle cx="-60" cy="55" r="3" fill="#38bdf8" />
                <circle cx="60" cy="55" r="3" fill="#38bdf8" />
              </g>

              {/* Fibonacci Golden Spiral */}
              <g
                transform="translate(240, 680) scale(0.7)"
                stroke="#6366f1"
                strokeWidth="1.2"
                fill="none"
              >
                <rect
                  x="-80"
                  y="-80"
                  width="160"
                  height="160"
                  strokeDasharray="3 4"
                  opacity="0.4"
                />
                <rect
                  x="-80"
                  y="-80"
                  width="100"
                  height="100"
                  strokeDasharray="3 4"
                  opacity="0.4"
                />
                <path
                  d="M 0 0 A 25 25 0 0 1 25 25 A 40 40 0 0 1 -15 65 A 65 65 0 0 1 -80 0 A 105 105 0 0 1 25 -105"
                  strokeWidth="1.8"
                />
              </g>
            </svg>
          </>
        )}

        {/* ========================================================
            PRESET 3: "MINIMAL" (Swiss Artboard & Prepress CMYK)
           ======================================================== */}
        {preset === "minimal" && (
          <>
            {/* Subtle Alabaster / Dark Slate Matrix */}
            <div className="absolute inset-0 bg-radial from-slate-500/5 via-transparent to-transparent pointer-events-none" />

            <svg
              className="absolute inset-0 w-full h-full opacity-35 dark:opacity-20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern
                  id="minimal-dot-grid"
                  width="24"
                  height="24"
                  patternUnits="userSpaceOnUse"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="1"
                    className="fill-slate-500 dark:fill-slate-400"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#minimal-dot-grid)" />
            </svg>
          </>
        )}

        {/* ========================================================
            SHARED ULTRA-PREMIUM ARTBOARD WATERMARKS & HARDWARE GUIDES
           ======================================================== */}
        {/* Top Ruler Scales */}
        <div className="absolute top-0 left-0 right-0 h-4 border-b border-slate-200/50 dark:border-white/5 flex items-end justify-between px-6 opacity-30 dark:opacity-20 overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={`tick-scale-${i}`} className="flex items-end gap-1">
              <span
                className={`w-[1px] bg-slate-400 dark:bg-slate-400 ${
                  i % 5 === 0 ? "h-3" : "h-1.5"
                }`}
              />
              {i % 10 === 0 && (
                <span className="text-[7px] font-mono text-slate-400 dark:text-slate-500 hidden sm:inline">
                  {i * 50}PX
                </span>
              )}
            </div>
          ))}
        </div>

        {/* 4 Corner Crop / Bleed Marks */}
        <div className="absolute top-2.5 left-2.5 opacity-40 dark:opacity-25">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M 2 12 L 2 2 L 12 2"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-indigo-500 dark:text-indigo-400"
            />
          </svg>
        </div>
        <div className="absolute top-2.5 right-2.5 opacity-40 dark:opacity-25">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M 22 12 L 22 2 L 12 2"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-indigo-500 dark:text-indigo-400"
            />
          </svg>
        </div>
        <div className="absolute bottom-2.5 left-2.5 opacity-40 dark:opacity-25">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M 2 12 L 2 22 L 12 22"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-indigo-500 dark:text-indigo-400"
            />
          </svg>
        </div>
        <div className="absolute bottom-2.5 right-2.5 opacity-40 dark:opacity-25">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M 22 12 L 22 22 L 12 22"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-indigo-500 dark:text-indigo-400"
            />
          </svg>
        </div>

        {/* Center Top Registration Mark (⌖) */}
        <div className="absolute top-4.5 left-1/2 -translate-x-1/2 opacity-35 dark:opacity-20 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <circle
              cx="10"
              cy="10"
              r="7"
              stroke="currentColor"
              strokeWidth="1"
              className="text-indigo-600 dark:text-indigo-400"
            />
            <circle
              cx="10"
              cy="10"
              r="2.5"
              stroke="currentColor"
              strokeWidth="1"
              className="text-indigo-600 dark:text-indigo-400"
            />
            <line
              x1="10"
              y1="0"
              x2="10"
              y2="20"
              stroke="currentColor"
              strokeWidth="0.8"
              className="text-indigo-600 dark:text-indigo-400"
            />
            <line
              x1="0"
              y1="10"
              x2="20"
              y2="10"
              stroke="currentColor"
              strokeWidth="0.8"
              className="text-indigo-600 dark:text-indigo-400"
            />
          </svg>
          <span className="text-[8px] font-mono tracking-widest uppercase text-slate-500 dark:text-slate-400 hidden md:inline">
            ARTBOARD #01 • 300 DPI • RGB/CMYK
          </span>
        </div>

        {/* Bottom Left Dimension Info */}
        <div className="absolute bottom-4 left-6 opacity-40 dark:opacity-25 hidden sm:flex items-center gap-2 font-mono text-[9px] text-slate-500 dark:text-slate-400">
          <div className="w-3.5 h-3.5 border border-indigo-400/80 rounded-2xs relative">
            <div className="w-1 h-1 bg-indigo-500 absolute -top-0.5 -left-0.5 rounded-3xs" />
            <div className="w-1 h-1 bg-indigo-500 absolute -bottom-0.5 -right-0.5 rounded-3xs" />
          </div>
          <span>CANVAS: 1920 × 1080 (16:9)</span>
          <span className="text-indigo-500 dark:text-indigo-400 font-bold">
            • 100% VECTOR
          </span>
        </div>

        {/* Bottom Right CMYK Calibration Swatches Strip */}
        <div className="absolute bottom-4 right-6 opacity-50 dark:opacity-35 hidden sm:flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white/70 dark:bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200/80 dark:border-white/10 shadow-xs">
            <div
              className="w-2.5 h-2.5 rounded-full bg-[#00f0ff] ring-1 ring-cyan-400/40"
              title="Cyan (C:100)"
            />
            <div
              className="w-2.5 h-2.5 rounded-full bg-[#ff007a] ring-1 ring-pink-400/40"
              title="Magenta (M:100)"
            />
            <div
              className="w-2.5 h-2.5 rounded-full bg-[#ffdd00] ring-1 ring-yellow-400/40"
              title="Yellow (Y:100)"
            />
            <div
              className="w-2.5 h-2.5 rounded-full bg-[#0f172a] dark:bg-slate-300 ring-1 ring-slate-400/40"
              title="Key/Black (K:100)"
            />
            <div className="w-[1px] h-3 bg-slate-200 dark:bg-white/20 mx-0.5" />
            <div
              className="w-2.5 h-2.5 rounded-full bg-[#6366f1] ring-1 ring-indigo-400/40"
              title="Pantone Indigo"
            />
            <div
              className="w-2.5 h-2.5 rounded-full bg-[#a855f7] ring-1 ring-purple-400/40"
              title="Electric Violet"
            />
          </div>
        </div>
      </div>

      {/* ========================================================
          INTERACTIVE ULTRA-PREMIUM THEME SWITCHER CAPSULE
          (Floating at bottom-left above footer, subtle & elegant)
         ======================================================== */}
      <div className="fixed bottom-3 left-4 z-40 flex items-center">
        {showControls ? (
          <div className="flex items-center gap-1 p-1 bg-white/90 dark:bg-[#12131a]/90 backdrop-blur-xl rounded-2xl border border-slate-200/90 dark:border-white/15 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150">
            <button
              type="button"
              onClick={() => handleSelectPreset("aurora")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                preset === "aurora"
                  ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-sm shadow-indigo-500/30"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
              }`}
            >
              <LuSparkles size={12} />
              <span>Aurora</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset("blueprint")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                preset === "blueprint"
                  ? "bg-gradient-to-r from-sky-500 to-cyan-600 text-white shadow-sm shadow-sky-500/30"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
              }`}
            >
              <LuCompass size={12} />
              <span>Blueprint</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset("minimal")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                preset === "minimal"
                  ? "bg-slate-800 dark:bg-white dark:text-black text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
              }`}
            >
              <TbArtboard size={12} />
              <span>Minimal</span>
            </button>
            <button
              type="button"
              onClick={() => setShowControls(false)}
              className="px-2 py-1 text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs ml-0.5 cursor-pointer"
              title="Close theme switcher"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowControls(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/70 dark:bg-[#14151f]/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all text-[10px] font-semibold shadow-xs cursor-pointer active:scale-95 group"
            title="Switch Background Theme"
          >
            <LuPalette
              size={11}
              className="text-indigo-500 group-hover:rotate-45 transition-transform"
            />
            <span className="capitalize">{preset} Theme</span>
          </button>
        )}
      </div>
    </>
  );
};

export default memo(GraphicDesignerBackground);
