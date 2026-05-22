import React, { useState, useEffect, useRef } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import enIN from "date-fns/locale/en-IN";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useDispatch, useSelector } from "react-redux";
import { getEvents, createEvent, updateEvent, deleteEvent } from "../../features/events/eventSlice";
import { FiPlus, FiCalendar, FiTrash2, FiInstagram, FiVideo, FiLayers, FiTarget, FiFileText } from "react-icons/fi";
import EventModal from "./EventModal";
import toast from "react-hot-toast";

const locales = { "en-IN": enIN };

const localizer = dateFnsLocalizer({
  format, parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay, locales,
});

const TYPE_COLORS = {
  Post:   "#3b82f6",
  Reel:   "#ef4444",
  Story:  "#8b5cf6",
  Ad:     "#f59e0b",
  Report: "#10b981",
};

const playNotificationSound = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const playTone = (frequency, startTime, duration) => {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, startTime);
      gainNode.gain.setValueAtTime(0.15, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    const now = audioCtx.currentTime;
    playTone(1046.50, now, 0.15); // C6 tone
    playTone(1567.98, now + 0.1, 0.3); // G6 tone
  } catch (error) {
    console.error("Audio Context not supported or allowed:", error);
  }
};

const CalendarPage = () => {
  const dispatch = useDispatch();
  const { events } = useSelector((s) => s.events);

  const [openModal, setOpenModal]       = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEditing, setIsEditing]       = useState(false);

  const notifiedEvents = useRef(new Set());

  useEffect(() => { dispatch(getEvents()); }, [dispatch]);

  useEffect(() => {
    if (events && events.length > 0) {
      const today = new Date();
      const todayString = today.toDateString();
      let shouldPlaySound = false;

      events.forEach((event) => {
        const eventDate = new Date(event.date);
        if (eventDate.toDateString() === todayString) {
          if (!notifiedEvents.current.has(event._id)) {
            notifiedEvents.current.add(event._id);
            shouldPlaySound = true;

            toast((t) => (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                  <FiCalendar size={15} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wide">Event Today!</h4>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">{event.title}</p>
                  <p className="text-[9px] text-gray-400 font-semibold">{event.client?.companyName || "Client Event"}</p>
                </div>
              </div>
            ), {
              duration: 6000,
              position: "top-right",
              style: {
                borderRadius: "16px",
                background: "#ffffff",
                color: "#1e293b",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                border: "1px solid #f1f5f9",
                padding: "12px",
              }
            });
          }
        }
      });

      if (shouldPlaySound) {
        playNotificationSound();
      }
    }
  }, [events]);

  const handleSelectSlot = ({ start }) => {
    setSelectedEvent({ start }); setIsEditing(false); setOpenModal(true);
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event); setIsEditing(true); setOpenModal(true);
  };

  const handleEventSubmit = async (formData) => {
    try {
      if (isEditing) {
        await dispatch(updateEvent({ id: selectedEvent._id, eventData: formData })).unwrap();
        toast.success("Event Updated");
      } else {
        await dispatch(createEvent(formData)).unwrap();
        toast.success("Event Scheduled");
      }
      setOpenModal(false); setSelectedEvent(null);
    } catch (err) { toast.error(err); }
  };

  const handleDeleteEvent = async () => {
    if (!window.confirm("Delete this event?")) return;
    try {
      await dispatch(deleteEvent(selectedEvent._id)).unwrap();
      toast.success("Event Deleted");
      setOpenModal(false); setSelectedEvent(null);
    } catch (err) { toast.error(err); }
  };

  const calendarEvents = events.map((e) => ({
    ...e, start: new Date(e.date), end: new Date(e.date),
  }));

  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor: TYPE_COLORS[event.type] || "#3b82f6",
      borderRadius: "8px",
      color: "white",
      border: "none",
      fontSize: "0.7rem",
      padding: "0",
      boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
    },
  });

  const ICONS = { Post: <FiInstagram />, Reel: <FiVideo />, Story: <FiLayers />, Ad: <FiTarget />, Report: <FiFileText /> };

  const CustomEvent = ({ event }) => (
    <div className="flex flex-col px-1.5 py-1 h-full overflow-hidden">
      <div className="flex items-center gap-1 font-bold truncate">
        <span className="text-[9px] opacity-80">{ICONS[event.type]}</span>
        <span className="truncate text-[9px] uppercase tracking-tight">{event.client?.companyName || "Client"}</span>
      </div>
      <div className="truncate text-[10px] leading-tight">{event.title}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto py-4 sm:py-6">

        {/* HEADER */}
        <div className="flex justify-between items-center gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                <FiCalendar size={14} className="text-white" />
              </div>
              <h1 className="text-sm sm:text-lg md:text-xl font-bold text-slate-800">Content Calendar</h1>
            </div>
            <p className="text-[10px] sm:text-xs text-gray-400 ml-9 hidden xs:block">Orchestrate content cycles and marketing initiatives</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => { setSelectedEvent(null); setIsEditing(false); setOpenModal(true); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-sm shadow-blue-200 transition-all active:scale-95 shrink-0"
            >
              <FiPlus size={14} /> New Event
            </button>
          </div>
        </div>

        {/* CALENDAR */}
        <div className="bg-yellow-50 border border-gray-200 rounded-2xl p-3 sm:p-5 shadow-sm" style={{ height: "calc(100vh - 160px)", minHeight: "500px" }}>
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%" }}
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            components={{ event: CustomEvent }}
            views={["month", "week", "day"]}
            className="compact-calendar"
          />
        </div>
      </div>

      <EventModal
        open={openModal}
        setOpen={setOpenModal}
        onSubmit={handleEventSubmit}
        initialData={selectedEvent}
        isEditing={isEditing}
        onDelete={handleDeleteEvent}
      />

      <style>{`
        .compact-calendar { color: #1e293b; }
        .compact-calendar .rbc-off-range-bg { background: #f8fafc; }
        .compact-calendar .rbc-today { background: #eff6ff; }
        .compact-calendar .rbc-header {
          color: #94a3b8; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.1em;
          font-size: 0.65rem; padding: 10px 0;
          border-bottom: 1px solid #f1f5f9 !important;
        }
        .compact-calendar .rbc-month-view,
        .compact-calendar .rbc-time-view { border: none !important; background: transparent; }
        .compact-calendar .rbc-month-row { border-top: 1px solid #f1f5f9 !important; }
        .compact-calendar .rbc-day-bg + .rbc-day-bg { border-left: 1px solid #f1f5f9 !important; }
        .compact-calendar .rbc-toolbar-label {
          font-size: 1.1rem; font-weight: 800;
          color: #0f172a; letter-spacing: -0.02em;
        }
        .compact-calendar .rbc-toolbar button {
          color: #64748b; border: 1px solid #e2e8f0;
          background: white; border-radius: 10px;
          padding: 6px 14px; font-weight: 700; font-size: 0.75rem;
          transition: all 0.2s;
        }
        .compact-calendar .rbc-toolbar button:hover {
          background: #f8fafc; color: #0f172a; border-color: #cbd5e1;
        }
        .compact-calendar .rbc-toolbar button.rbc-active {
          background: #1e293b !important; color: white !important;
          border-color: #1e293b; box-shadow: 0 4px 12px rgba(15,23,42,0.15);
        }
        .compact-calendar .rbc-event { min-height: 36px; border-radius: 8px !important; }
        .compact-calendar .rbc-show-more {
          font-weight: 700; color: #3b82f6;
          font-size: 10px; text-transform: uppercase;
        }
        @media (max-width: 640px) {
          .compact-calendar .rbc-toolbar { flex-direction: column; gap: 8px; }
          .compact-calendar .rbc-toolbar-label { font-size: 0.95rem; }
          .compact-calendar .rbc-toolbar button { padding: 5px 10px; font-size: 0.7rem; }
        }
      `}</style>
    </div>
  );
};

export default CalendarPage;
