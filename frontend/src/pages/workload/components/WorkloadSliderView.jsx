import React, { useRef, useState, useCallback, useEffect, useMemo } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiGrid,
  FiMaximize2,
  FiMinimize2,
} from "react-icons/fi";
import { LuPalette, LuVideo } from "react-icons/lu";
import WorkloadCard from "./WorkloadCard.jsx";

// ==========================================
// WORKLOAD SLIDER VIEW COMPONENT (SAME LINE)
// Ultra-smooth horizontal carousel for Team Members
// ==========================================
const WorkloadSliderView = React.memo(({
  workloads = [],
  expandedUserIds,
  onToggleExpand,
  onToggleAllExpand,
  onViewTask,
  selectedDepartment,
  onSetViewMode,
}) => {
  const sliderRef = useRef(null);

  // Scroll state
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Mouse Drag-to-Scroll state
  const isDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  // Department metadata
  const isCinema = selectedDepartment === "Cinematographer";
  const deptTitle = isCinema ? "Cinematographer Workload" : "Graphic Designer Workload";
  const deptIcon = isCinema ? <LuVideo size={18} /> : <LuPalette size={18} />;

  // Status counts for live summary
  const { onlineCount, busyCount, pausedCount, offlineCount, overloadedCount } = useMemo(() => {
    let online = 0;
    let busy = 0;
    let paused = 0;
    let offline = 0;
    let overloaded = 0;

    workloads.forEach((w) => {
      if (w.isOnline) online++;
      else offline++;

      if (w.availability?.status === "busy") busy++;
      else if (w.availability?.status === "paused") paused++;

      if (w.cardTheme?.isOverloaded) overloaded++;
    });

    return {
      onlineCount: online,
      busyCount: busy,
      pausedCount: paused,
      offlineCount: offline,
      overloadedCount: overloaded,
    };
  }, [workloads]);

  // Check if all cards are expanded
  const allExpanded = useMemo(() => {
    return (
      workloads.length > 0 &&
      workloads.every((w) => expandedUserIds?.has(w.user._id))
    );
  }, [workloads, expandedUserIds]);

  const handleToggleAll = useCallback(() => {
    if (onToggleAllExpand) {
      onToggleAllExpand(!allExpanded);
    } else {
      workloads.forEach((w) => {
        const isExp = expandedUserIds?.has(w.user._id);
        if (allExpanded && isExp) onToggleExpand(w.user._id);
        if (!allExpanded && !isExp) onToggleExpand(w.user._id);
      });
    }
  }, [onToggleAllExpand, allExpanded, workloads, expandedUserIds, onToggleExpand]);

  // Recalculate scroll boundaries & current slide index
  const updateScrollState = useCallback(() => {
    const el = sliderRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 12);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 12);

    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll > 0) {
      setScrollProgress((scrollLeft / maxScroll) * 100);
    } else {
      setScrollProgress(100);
      setCanScrollLeft(false);
      setCanScrollRight(false);
    }

    // Determine current index based on cards
    const children = el.children;
    if (children && children.length > 0) {
      const containerLeft = el.getBoundingClientRect().left;
      let closestIdx = 0;
      let minDistance = Infinity;

      for (let i = 0; i < children.length; i++) {
        const childRect = children[i].getBoundingClientRect();
        const dist = Math.abs(childRect.left - containerLeft);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = i;
        }
      }
      setCurrentIndex(closestIdx);
    }
  }, []);

  const handleScroll = useCallback(() => {
    updateScrollState();
  }, [updateScrollState]);

  useEffect(() => {
    updateScrollState();
    const handleResize = () => updateScrollState();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateScrollState, workloads.length]);

  // Scroll actions
  const handleScrollStep = useCallback((direction) => {
    const el = sliderRef.current;
    if (!el) return;

    // Scroll by approx one card width + gap (~410px) or 80% client width
    const firstChild = el.firstElementChild;
    const cardStep = firstChild
      ? firstChild.getBoundingClientRect().width + 20
      : Math.max(340, el.clientWidth * 0.75);

    el.scrollBy({
      left: direction === "next" ? cardStep : -cardStep,
      behavior: "smooth",
    });
  }, []);

  const scrollToIndex = useCallback((idx) => {
    const el = sliderRef.current;
    if (!el) return;
    const target = el.children[idx];
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
    }
  }, []);

  // Mouse Drag-to-Slide Handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0 || !sliderRef.current) return;
    isDownRef.current = true;
    startXRef.current = e.pageX - sliderRef.current.offsetLeft;
    scrollLeftRef.current = sliderRef.current.scrollLeft;
    hasDraggedRef.current = false;
  };

  const handleMouseMove = (e) => {
    if (!isDownRef.current || !sliderRef.current) return;
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = x - startXRef.current;
    if (Math.abs(walk) > 6) {
      if (!isDragging) setIsDragging(true);
      hasDraggedRef.current = true;
      sliderRef.current.scrollLeft = scrollLeftRef.current - walk;
    }
  };

  const handleMouseUp = () => {
    isDownRef.current = false;
    setTimeout(() => {
      setIsDragging(false);
      hasDraggedRef.current = false;
    }, 60);
  };

  const handleMouseLeave = () => {
    isDownRef.current = false;
    setIsDragging(false);
  };

  const handleClickCapture = (e) => {
    if (hasDraggedRef.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  if (!workloads || workloads.length === 0) return null;

  return (
    <div className="space-y-3.5 select-none font-inter">
      {/* ── 1. SLIDER CONTROLS & CAPACITY OVERVIEW HEADER ── */}
      <div className="bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3.5 transition-all">
        {/* Left: Department Icon + Name + Live Capacity Summary Chips */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20 shrink-0">
              {deptIcon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  {deptTitle}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 shadow-2xs">
                  {workloads.length} {workloads.length === 1 ? "Member" : "Members"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-tight mt-0.5">
                Single-line capacity slider • Scroll or drag to explore team members
              </p>
            </div>
          </div>

          {/* Real-time Status Badges */}
          <div className="hidden lg:flex items-center gap-1.5 pl-3 border-l border-slate-200 dark:border-slate-800 text-xs font-bold">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{onlineCount} Online</span>
            </span>

            {busyCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/60">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                <span>{busyCount} Working</span>
              </span>
            )}

            {pausedCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>{pausedCount} Paused</span>
              </span>
            )}

            {overloadedCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>{overloadedCount} Overloaded</span>
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions (Expand All, View Grid Switcher, Prev / Next Buttons) */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap sm:flex-nowrap">
          {/* Quick Expand / Collapse All Tasks Toggle */}
          <button
            type="button"
            onClick={handleToggleAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 hover:bg-slate-200/80 dark:bg-[#1e293b]/80 dark:hover:bg-[#1e293b] border border-slate-200 dark:border-slate-700/80 transition-all cursor-pointer shadow-2xs"
            title={allExpanded ? "Collapse all task lists" : "Expand all task lists"}
          >
            {allExpanded ? <FiMinimize2 size={13} /> : <FiMaximize2 size={13} />}
            <span className="hidden sm:inline">{allExpanded ? "Collapse All Tasks" : "Expand All Tasks"}</span>
            <span className="sm:hidden">{allExpanded ? "Collapse" : "Expand"}</span>
          </button>

          {/* Switch to Grid Layout if user desires */}
          {onSetViewMode && (
            <button
              type="button"
              onClick={() => onSetViewMode("grid")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200/80 dark:bg-[#1e293b]/80 dark:hover:bg-[#1e293b] border border-slate-200 dark:border-slate-700/80 transition-all cursor-pointer shadow-2xs"
              title="Switch to Multi-row Grid View"
            >
              <FiGrid size={13} />
              <span className="hidden md:inline">Grid View</span>
            </button>
          )}

          {/* Current Slide Counter */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#1e293b]/80 border border-slate-200 dark:border-slate-700/80 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-2xs">
            <span className="text-indigo-600 dark:text-indigo-400 font-black">
              {currentIndex + 1}
            </span>
            <span className="text-slate-400 mx-1">/</span>
            <span>{workloads.length}</span>
          </div>

          {/* Previous Slider Button */}
          <button
            type="button"
            onClick={() => handleScrollStep("prev")}
            disabled={!canScrollLeft}
            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
              canScrollLeft
                ? "bg-white dark:bg-[#1e293b] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 shadow-xs active:scale-95"
                : "bg-slate-100 dark:bg-slate-800/40 text-slate-300 dark:text-slate-600 border-slate-200/60 dark:border-slate-800 cursor-not-allowed opacity-40"
            }`}
            aria-label="Previous team member"
            title="Previous member"
          >
            <FiChevronLeft size={16} />
          </button>

          {/* Next Slider Button */}
          <button
            type="button"
            onClick={() => handleScrollStep("next")}
            disabled={!canScrollRight}
            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
              canScrollRight
                ? "bg-white dark:bg-[#1e293b] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 shadow-xs active:scale-95"
                : "bg-slate-100 dark:bg-slate-800/40 text-slate-300 dark:text-slate-600 border-slate-200/60 dark:border-slate-800 cursor-not-allowed opacity-40"
            }`}
            aria-label="Next team member"
            title="Next member"
          >
            <FiChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ── 2. HORIZONTAL SLIDER TRACK ── */}
      <div className="relative group/slider-track">
        {/* Left Floating Overlay Arrow */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-slate-50/95 via-slate-50/70 to-transparent dark:from-[#070b14]/95 dark:via-[#070b14]/70 dark:to-transparent z-20 pointer-events-none flex items-center justify-start pl-2">
            <button
              type="button"
              onClick={() => handleScrollStep("prev")}
              className="pointer-events-auto w-10 h-10 rounded-full bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-indigo-500/20 hover:scale-110 active:scale-95 flex items-center justify-center transition-all cursor-pointer hover:bg-indigo-600 hover:text-white hover:border-indigo-600"
              title="Previous member"
            >
              <FiChevronLeft size={20} />
            </button>
          </div>
        )}

        {/* Right Floating Overlay Arrow */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-slate-50/95 via-slate-50/70 to-transparent dark:from-[#070b14]/95 dark:via-[#070b14]/70 dark:to-transparent z-20 pointer-events-none flex items-center justify-end pr-2">
            <button
              type="button"
              onClick={() => handleScrollStep("next")}
              className="pointer-events-auto w-10 h-10 rounded-full bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-indigo-500/20 hover:scale-110 active:scale-95 flex items-center justify-center transition-all cursor-pointer hover:bg-indigo-600 hover:text-white hover:border-indigo-600"
              title="Next member"
            >
              <FiChevronRight size={20} />
            </button>
          </div>
        )}

        {/* Scrollable Track (Same Line) */}
        <div
          ref={sliderRef}
          onScroll={handleScroll}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onClickCapture={handleClickCapture}
          className={`flex gap-5 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-2.5 px-1 items-start ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          style={{
            WebkitOverflowScrolling: "touch",
          }}
        >
          {workloads.map((workload, idx) => (
            <div
              key={workload.user._id}
              className="w-[330px] sm:w-[360px] md:w-[380px] lg:w-[400px] shrink-0 snap-start transition-all duration-200"
            >
              <WorkloadCard
                workload={workload}
                isExpanded={expandedUserIds?.has(workload.user._id)}
                onToggleExpand={onToggleExpand}
                onViewTask={onViewTask}
                selectedDepartment={selectedDepartment}
                cardIndex={idx + 1}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. BOTTOM SLIDER PROGRESS & JUMP DOTS ── */}
      <div className="flex items-center justify-between gap-4 px-2 pt-1 text-xs text-slate-500 dark:text-slate-400">
        {/* Progress Bar */}
        <div className="flex-1 max-w-[220px] h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 rounded-full transition-all duration-150"
            style={{ width: `${Math.max(10, scrollProgress)}%` }}
          />
        </div>

        {/* Jump-to-member interactive dots (visible when <= 16 members) */}
        {workloads.length <= 16 && (
          <div className="flex items-center gap-1.5">
            {workloads.map((w, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={w.user._id}
                  type="button"
                  onClick={() => scrollToIndex(idx)}
                  className={`transition-all duration-200 cursor-pointer rounded-full ${
                    isActive
                      ? "w-6 h-2 bg-indigo-600 dark:bg-indigo-400"
                      : "w-2 h-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-500"
                  }`}
                  title={`Jump to ${w.user.name}`}
                  aria-label={`Jump to ${w.user.name}`}
                />
              );
            })}
          </div>
        )}

        {/* Helpful navigation indicator text */}
        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 hidden sm:inline">
          Tip: Drag cards with mouse or use arrow buttons to slide
        </span>
      </div>
    </div>
  );
});

export default WorkloadSliderView;
