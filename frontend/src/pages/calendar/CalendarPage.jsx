import React, { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import enUS from "date-fns/locale/en-US";
import enIN from "date-fns/locale/en-IN";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useDispatch, useSelector } from "react-redux";
import { getEvents, createEvent, updateEvent, deleteEvent } from "../../features/events/eventSlice";
import { FiPlus, FiCalendar, FiTrash2, FiInstagram, FiVideo, FiLayers, FiTarget, FiFileText } from "react-icons/fi";
import EventModal from "./EventModal";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

const locales = {
  "en-IN": enIN,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const CalendarPage = () => {
  const dispatch = useDispatch();
  const { events } = useSelector((state) => state.events);

  const [openModal, setOpenModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    dispatch(getEvents());
  }, [dispatch]);

  const handleSelectSlot = ({ start }) => {
    setSelectedEvent({ start });
    setIsEditing(false);
    setOpenModal(true);
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setIsEditing(true);
    setOpenModal(true);
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
      setOpenModal(false);
      setSelectedEvent(null);
    } catch (err) {
      toast.error(err);
    }
  };

  const handleDeleteEvent = async () => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await dispatch(deleteEvent(selectedEvent._id)).unwrap();
        toast.success("Event Deleted");
        setOpenModal(false);
        setSelectedEvent(null);
      } catch (err) {
        toast.error(err);
      }
    }
  };

  // Map events to format expected by react-big-calendar
  const calendarEvents = events.map((event) => ({
    ...event,
    start: new Date(event.date),
    end: new Date(event.date),
  }));

  const eventStyleGetter = (event) => {
    const typeColors = {
      Post: "#3b82f6",
      Reel: "#ef4444",
      Story: "#8b5cf6",
      Ad: "#f59e0b",
      Report: "#10b981",
    };
    
    return {
      style: {
        backgroundColor: typeColors[event.type] || "#3b82f6",
        borderRadius: "12px",
        opacity: 1,
        color: "white",
        border: "none",
        display: "block",
        fontSize: "0.75rem",
        padding: "0",
        overflow: "hidden",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
      },
    };
  };

  const CustomEvent = ({ event }) => {
    const icons = {
      Post: <FiInstagram />,
      Reel: <FiVideo />,
      Story: <FiLayers />,
      Ad: <FiTarget />,
      Report: <FiFileText />,
    };

    return (
      <div className="flex flex-col p-2 h-full justify-between overflow-hidden">
        <div className="flex items-center gap-1.5 font-bold truncate">
           <span className="text-[10px] opacity-80">{icons[event.type]}</span>
           <span className="truncate uppercase tracking-tighter text-[9px]">{event.client?.companyName || "Client"}</span>
        </div>
        <div className="truncate text-[11px] font-medium leading-tight">
          {event.title}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100 px-4 sm:px-6 lg:px-10 py-6 md:py-10">
      <div className="max-w-9xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                <FiCalendar size={28} />
              </div>
              Strategic Planner
            </h1>
            <p className="text-gray-500 mt-2 text-lg">Orchestrate content cycles and marketing initiatives</p>
          </div>

          <button
            onClick={() => {
              setSelectedEvent(null);
              setIsEditing(false);
              setOpenModal(true);
            }}
            className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg shadow-[0_15px_30px_rgba(37,99,235,0.3)] hover:scale-105 hover:shadow-[0_20px_40px_rgba(37,99,235,0.4)] transition-all active:scale-95"
          >
            <FiPlus size={24} />
            Post Initiative
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white border border-gray-200 rounded-[2.5rem] p-6 md:p-10 shadow-[0_30px_70px_rgba(15,23,42,0.08)] h-[850px]"
        >
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
            components={{
              event: CustomEvent,
            }}
            views={["month", "week", "day"]}
            className="custom-calendar"
          />
        </motion.div>
      </div>

      <EventModal
        open={openModal}
        setOpen={setOpenModal}
        onSubmit={handleEventSubmit}
        initialData={selectedEvent}
        isEditing={isEditing}
      />
      
      {isEditing && openModal && (
         <div className="fixed bottom-12 right-12 z-[60]">
             <button 
                onClick={handleDeleteEvent}
                className="w-20 h-20 rounded-3xl bg-rose-500 text-white flex items-center justify-center shadow-[0_20px_40px_rgba(244,63,94,0.3)] hover:scale-110 active:scale-95 transition-all animate-pulse"
                title="Deconstruct Event"
             >
                <FiTrash2 size={32} />
             </button>
         </div>
      )}
      
      <style>{`
        .custom-calendar {
          color: #1e293b;
        }
        .rbc-off-range-bg {
          background: #f8fafc;
        }
        .rbc-today {
          background: #eff6ff;
        }
        .rbc-header {
          color: #94a3b8;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          font-size: 0.7rem;
          padding: 24px 0;
          border-bottom: 1px solid #f1f5f9 !important;
        }
        .rbc-month-view, .rbc-time-view {
          border: none !important;
          background: transparent;
        }
        .rbc-month-row {
          border-top: 1px solid #f1f5f9 !important;
        }
        .rbc-day-bg + .rbc-day-bg {
          border-left: 1px solid #f1f5f9 !important;
        }
        .rbc-toolbar-label {
          font-size: 1.75rem;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.03em;
        }
        .rbc-toolbar button {
          color: #64748b;
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 16px;
          padding: 10px 24px;
          font-weight: 800;
          transition: all 0.3s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        .rbc-toolbar button:hover {
          background: #f8fafc;
          color: #0f172a;
          border-color: #cbd5e1;
        }
        .rbc-toolbar button.rbc-active {
          background: #0f172a !important;
          color: white !important;
          border-color: #0f172a;
          box-shadow: 0 10px 20px rgba(15, 23, 42, 0.15);
        }
        .rbc-event {
          min-height: 52px;
          border-radius: 14px !important;
        }
        .rbc-show-more {
          font-weight: 900;
          color: #3b82f6;
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.05em;
        }
        @media (max-width: 768px) {
          .rbc-toolbar {
            flex-direction: column;
            gap: 15px;
          }
          .rbc-toolbar-label {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
};

export default CalendarPage;
