import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import WelcomeUser from '../admin/partnerhub/components/WelcomeUser'
import DashboardCards from './cards/DashboardCards'
import { getEvents } from '../../features/events/eventSlice'
import {
  FiCalendar,
  FiClock,
  FiInstagram,
  FiVideo,
  FiLayers,
  FiTarget,
  FiFileText,
  FiUser,
  FiChevronRight,
  FiAlertCircle
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const TYPE_CONFIG = {
  Post: { color: "text-blue-500 bg-blue-500/10 border-blue-500/20", icon: FiInstagram },
  Reel: { color: "text-rose-500 bg-rose-500/10 border-rose-500/20", icon: FiVideo },
  Story: { color: "text-purple-500 bg-purple-500/10 border-purple-500/20", icon: FiLayers },
  Ad: { color: "text-amber-500 bg-amber-500/10 border-amber-500/20", icon: FiTarget },
  Report: { color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", icon: FiFileText },
  "Birthday Celebration": { color: "text-pink-500 bg-pink-500/10 border-pink-500/20", icon: FiCalendar },
};

const Dashboardmain = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { events, loading } = useSelector((state) => state.events);

  useEffect(() => {
    dispatch(getEvents());
  }, [dispatch]);

  // Filter and sort upcoming events (today and future)
  const upcomingEvents = React.useMemo(() => {
    if (!events) return [];
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    return events
      .filter((event) => new Date(event.date) >= todayStart)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 4); // Limit to top 4 upcoming events
  }, [events]);

  const getRelativeTimeString = (eventDateStr) => {
    const eventDate = new Date(eventDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const eventDay = new Date(eventDate);
    eventDay.setHours(0, 0, 0, 0);

    const timeString = eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (eventDay.getTime() === today.getTime()) {
      return `Today at ${timeString}`;
    } else if (eventDay.getTime() === tomorrow.getTime()) {
      return `Tomorrow at ${timeString}`;
    } else {
      return `${eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${timeString}`;
    }
  };

  const isToday = (eventDateStr) => {
    const eventDate = new Date(eventDateStr);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  };

  return (
    <div className="space-y-6 pb-8">
      {/* GREETING */}
      <WelcomeUser />

      {/* STATS CARDS FOR ADMIN */}
      {user?.role === 'admin' && (
        <DashboardCards />
      )}

      {/* TWO-COLUMN LOWER DASHBOARD SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl">
        
        {/* UPCOMING EVENTS SECTION */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5 border-b border-slate-100 dark:border-slate-800/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-sm">
                <FiCalendar size={15} />
              </div>
              <div>
                <h2 className="text-[13px] font-black text-slate-850 dark:text-yellow-50 uppercase tracking-wider">
                  Upcoming Events & Deliverables
                </h2>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                  Next scheduled calendar initiatives and marketing deadlines
                </p>
              </div>
            </div>

            <Link
              to={`/${user?.role}/calendar`}
              className="text-[10px] font-black text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-350 flex items-center gap-1 uppercase tracking-wider transition-colors"
            >
              Calendar Page
              <FiChevronRight size={10} className="stroke-[3]" />
            </Link>
          </div>

          {/* Live Events List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[10px] text-slate-400 font-bold">Refreshing schedule...</span>
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingEvents.map((event) => {
                const conf = TYPE_CONFIG[event.type] || { color: "text-slate-500 bg-slate-500/10 border-slate-500/20", icon: FiCalendar };
                const EventIcon = conf.icon;
                const eventIsToday = isToday(event.date);

                return (
                  <motion.div
                    whileHover={{ y: -2, transition: { duration: 0.15 } }}
                    key={event._id}
                    className={`relative overflow-hidden p-4 rounded-xl border flex flex-col justify-between transition-all bg-slate-50 dark:bg-black/35 ${
                      eventIsToday
                        ? 'border-indigo-500/40 dark:border-indigo-900/40 ring-1 ring-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.05)]'
                        : 'border-slate-200/50 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-750'
                    }`}
                  >
                    {/* Live Pulse Badge for Today's events */}
                    {eventIsToday && (
                      <span className="absolute top-3 right-3 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                      </span>
                    )}

                    <div>
                      {/* Meta header */}
                      <div className="flex items-center justify-between mb-2.5">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${conf.color} flex items-center gap-1`}>
                          <EventIcon size={9} />
                          {event.type}
                        </span>

                        <span className="text-[9px] text-slate-400 dark:text-slate-550 font-bold flex items-center gap-1">
                          <FiClock size={10} />
                          {getRelativeTimeString(event.date)}
                        </span>
                      </div>

                      {/* Event Title */}
                      <h3 className="text-xs font-black text-slate-800 dark:text-white line-clamp-1">
                        {event.title}
                      </h3>

                      {/* Description */}
                      {event.description && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-1 leading-normal font-medium line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>

                    {/* Client Footer */}
                    <div className="mt-3.5 pt-2.5 border-t border-slate-200/40 dark:border-slate-800/40 flex items-center justify-between text-[9px] font-bold">
                      <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Client Account
                      </span>
                      <span className="text-slate-750 dark:text-slate-300 font-extrabold max-w-[150px] truncate">
                        {event.client?.companyName || "Internal Event"}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-3 text-slate-400">
                <FiAlertCircle size={18} />
              </div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                No Upcoming Scheduled Initiatives
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                There are no scheduled events, reports, or content deliverables listed for today or the coming week.
              </p>
            </div>
          )}
        </div>

        {/* WORKSPACE & ACTION SHORTCUTS */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-sm">
                <FiTarget size={15} />
              </div>
              <div>
                <h2 className="text-[13px] font-black text-slate-850 dark:text-yellow-50 uppercase tracking-wider">
                  Shortcut Navigation
                </h2>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                  Quick access to operational zones
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Link
                to={`/${user?.role}/projects`}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/70 dark:bg-black/35 dark:hover:bg-black/50 border border-slate-200/40 dark:border-slate-800/60 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                    <FiLayers size={12} />
                  </span>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-350 truncate">
                    Active Projects & Tasks
                  </span>
                </div>
                <FiChevronRight size={12} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to={`/${user?.role}/chat`}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/70 dark:bg-black/35 dark:hover:bg-black/50 border border-slate-200/40 dark:border-slate-800/60 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                    <FiUser size={12} />
                  </span>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-350 truncate">
                    Team Chats & Rooms
                  </span>
                </div>
                <FiChevronRight size={12} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              {user?.role === 'admin' && (
                <Link
                  to={`/admin/clients`}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/70 dark:bg-black/35 dark:hover:bg-black/50 border border-slate-200/40 dark:border-slate-800/60 transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                      <FiUser size={12} />
                    </span>
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-350 truncate">
                      Manage Portfolios
                    </span>
                  </div>
                  <FiChevronRight size={12} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              )}
            </div>
          </div>

         
        </div>

      </div>
    </div>
  )
}

export default Dashboardmain