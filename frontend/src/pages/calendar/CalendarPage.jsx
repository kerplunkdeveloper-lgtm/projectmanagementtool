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
    <div className="min-h-screen p-2 md:p-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-white flex items-center gap-4">
            <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <FiCalendar size={32} />
            </div>
            Planner
          </h1>
          <p className="text-gray-400 mt-2 text-lg">Content Schedule & Strategy</p>
        </div>

        <button
          onClick={() => {
            setSelectedEvent(null);
            setIsEditing(false);
            setOpenModal(true);
          }}
          className="flex items-center justify-center gap-3 px-10 py-5 rounded-[2rem] bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-lg hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/40 transition-all duration-300 active:scale-95"
        >
          <FiPlus size={24} />
          Post Event
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-[#111827]/80 border border-white/10 rounded-[3rem] p-4 md:p-8 backdrop-blur-2xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] h-[850px]"
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
                className="w-20 h-20 rounded-full bg-red-500 text-white flex items-center justify-center shadow-[0_0_50px_rgba(239,68,68,0.4)] hover:scale-110 active:scale-95 transition-all animate-pulse"
                title="Delete Event"
             >
                <FiTrash2 size={32} />
             </button>
         </div>
      )}
      
      <style>{`
        .custom-calendar {
          color: #f3f4f6;
        }
        .rbc-off-range-bg {
          background: rgba(0, 0, 0, 0.2);
        }
        .rbc-today {
          background: rgba(34, 211, 238, 0.1);
        }
        .rbc-header {
          color: #6b7280;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-size: 0.75rem;
          padding: 20px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
        }
        .rbc-month-view, .rbc-time-view {
          border: none !important;
          background: transparent;
        }
        .rbc-month-row {
          border-top: 1px solid rgba(255, 255, 255, 0.05) !important;
        }
        .rbc-day-bg + .rbc-day-bg {
          border-left: 1px solid rgba(255, 255, 255, 0.05) !important;
        }
        .rbc-toolbar-label {
          font-size: 1.75rem;
          font-weight: 900;
          color: white;
          letter-spacing: -0.02em;
        }
        .rbc-toolbar button {
          color: #9ca3af;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.02);
          border-radius: 14px;
          padding: 10px 20px;
          font-weight: 700;
          transition: all 0.3s;
        }
        .rbc-toolbar button:hover {
          background: rgba(255, 255, 255, 0.05);
          color: white;
        }
        .rbc-toolbar button.rbc-active {
          background: white !important;
          color: black !important;
          border-color: white;
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
        }
        .rbc-event {
          min-height: 50px;
        }
        .invert-calendar-icon::-webkit-calendar-picker-indicator {
          filter: invert(1);
          cursor: pointer;
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
