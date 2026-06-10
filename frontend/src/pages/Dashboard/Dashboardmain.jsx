import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import WelcomeUser from '../admin/partnerhub/components/WelcomeUser'
import DashboardCards from './cards/DashboardCards'
import { getEvents } from '../../features/events/eventSlice'
import { getProjects, createProject } from '../../features/projects/projectSlice'
import { getClients } from '../../features/clients/clientslice'
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
  FiAlertCircle,
  FiPlus,
  FiList,
  FiBriefcase,
  FiX,
  FiChevronDown
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

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
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { events, loading } = useSelector((state) => state.events);
  const { projects } = useSelector((state) => state.projects);
  const { clients } = useSelector((state) => state.clients);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [status, setStatus] = useState("Active");

  useEffect(() => {
    dispatch(getEvents());
    dispatch(getProjects());
    if (user?.role === "admin") {
      dispatch(getClients());
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (clients && clients.length > 0 && !clientId) {
      setClientId(clients[0]._id);
    }
  }, [clients, clientId]);

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!name || !clientId) return;
    dispatch(
      createProject({
        name,
        client: clientId,
        status,
      })
    );
    setShowCreateModal(false);
    setName("");
    setClientId(clients[0]?._id || "");
    setStatus("Active");
  };

  const projectColors = [
    "bg-fuchsia-300 text-fuchsia-900 dark:bg-fuchsia-400 dark:text-fuchsia-950",
    "bg-emerald-300 text-emerald-900 dark:bg-emerald-400 dark:text-emerald-950",
    "bg-lime-300 text-lime-900 dark:bg-lime-400 dark:text-lime-950",
    "bg-indigo-300 text-indigo-900 dark:bg-indigo-400 dark:text-indigo-950",
    "bg-rose-300 text-rose-900 dark:bg-rose-400 dark:text-rose-950",
    "bg-cyan-300 text-cyan-900 dark:bg-cyan-400 dark:text-cyan-950"
  ];

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
    <div className="space-y-4 pb-6">
      {/* GREETING */}
      <WelcomeUser />


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 mb-4 ">

        <div className='col-span-1'>
          <DashboardCards />
        </div>

        <div className='col-span-1 theme-bg-card border theme-border rounded-xl p-4 shadow-sm'>
          <h1 className="text-[13px] font-black theme-text-primary uppercase tracking-wider mb-4">Projects</h1>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* CREATE PROJECT BUTTON */}
            {user?.role === "admin" && (
              <button 
                onClick={() => setShowCreateModal(true)} 
                className="flex items-center gap-2 group text-left"
              >
                <div className="w-10 h-10 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:border-slate-400 dark:group-hover:border-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors shrink-0">
                  <FiPlus size={18} />
                </div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-300 transition-colors">Create project</span>
              </button>
            )}

            {/* PROJECTS LIST */}
            {projects && projects.map((project, index) => (
              <button 
                 key={project._id}
                 onClick={() => navigate(`/${user?.role}/projects?id=${project._id}`)}
                 className="flex items-center gap-2 group text-left"
              >
                 <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${projectColors[index % projectColors.length]} transition-transform group-hover:scale-[1.03] shrink-0`}>
                   <FiList size={18} className="opacity-90" />
                 </div>
                 <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">{project.name}</span>
              </button>
            ))}
          </div>
        </div>



      {/* {user?.role === 'admin' && (
            <DashboardCards />
      )} */}

      </div>

    

      {/* TWO-COLUMN LOWER DASHBOARD SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-7xl">
        
        {/* UPCOMING EVENTS SECTION */}
        <div className="lg:col-span-2 theme-bg-card border theme-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b theme-border pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-sm">
                <FiCalendar size={15} />
              </div>
              <div>
                <h2 className="text-[13px] font-black theme-text-primary uppercase tracking-wider">
                  Upcoming Events & Deliverables
                </h2>
                <p className="text-[10px] theme-text-secondary font-bold">
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
              <span className="text-[10px] theme-text-secondary font-bold">Refreshing schedule...</span>
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
                    className={`relative overflow-hidden p-3.5 rounded-xl border flex flex-col justify-between transition-all theme-bg-main ${
                      eventIsToday
                        ? 'border-indigo-500/40 dark:border-indigo-900/40 ring-1 ring-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.05)]'
                        : 'theme-border hover:border-slate-300 dark:hover:border-slate-750'
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

                        <span className="text-[9px] theme-text-secondary font-bold flex items-center gap-1">
                          <FiClock size={10} />
                          {getRelativeTimeString(event.date)}
                        </span>
                      </div>

                      {/* Event Title */}
                      <h3 className="text-xs font-black theme-text-primary line-clamp-1">
                        {event.title}
                      </h3>

                      {/* Description */}
                      {event.description && (
                        <p className="text-[10px] theme-text-secondary mt-1 leading-normal font-medium line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>

                    {/* Client Footer */}
                    <div className="mt-3.5 pt-2.5 border-t theme-border flex items-center justify-between text-[9px] font-bold">
                      <span className="theme-text-secondary uppercase tracking-wider">
                        Client Account
                      </span>
                      <span className="theme-text-primary font-extrabold max-w-[150px] truncate">
                        {event.client?.companyName || "Internal Event"}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full theme-bg-main flex items-center justify-center mb-3 theme-icon">
                <FiAlertCircle size={18} />
              </div>
              <h4 className="text-xs font-bold theme-text-primary">
                No Upcoming Scheduled Initiatives
              </h4>
              <p className="text-[10px] theme-text-secondary mt-1 max-w-xs">
                There are no scheduled events, reports, or content deliverables listed for today or the coming week.
              </p>
            </div>
          )}
        </div>

        {/* WORKSPACE & ACTION SHORTCUTS */}
        <div className="theme-bg-card border theme-border rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 border-b theme-border pb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-sm">
                <FiTarget size={15} />
              </div>
              <div>
                <h2 className="text-[13px] font-black theme-text-primary uppercase tracking-wider">
                  Shortcut Navigation
                </h2>
                <p className="text-[10px] theme-text-secondary font-bold">
                  Quick access to operational zones
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Link
                to={`/${user?.role}/projects`}
                className="flex items-center justify-between p-3 rounded-xl theme-bg-main hover:bg-slate-100/70 border theme-border transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                    <FiLayers size={12} />
                  </span>
                  <span className="text-[11px] font-bold theme-text-primary truncate">
                    Active Projects & Tasks
                  </span>
                </div>
                <FiChevronRight size={12} className="theme-icon group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to={`/${user?.role}/chat`}
                className="flex items-center justify-between p-3 rounded-xl theme-bg-main hover:bg-slate-100/70 border theme-border transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                    <FiUser size={12} />
                  </span>
                  <span className="text-[11px] font-bold theme-text-primary truncate">
                    Team Chats & Rooms
                  </span>
                </div>
                <FiChevronRight size={12} className="theme-icon group-hover:translate-x-0.5 transition-transform" />
              </Link>

              {user?.role === 'admin' && (
                <Link
                  to={`/admin/clients`}
                  className="flex items-center justify-between p-3 rounded-xl theme-bg-main hover:bg-slate-100/70 border theme-border transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                      <FiUser size={12} />
                    </span>
                    <span className="text-[11px] font-bold theme-text-primary truncate">
                      Manage clients profiles
                    </span>
                  </div>
                  <FiChevronRight size={12} className="theme-icon group-hover:translate-x-0.5 transition-transform" />
                </Link>
              )}
            </div>
          </div>

         
        </div>

      </div>

      {/* CREATE PROJECT OFFCANVAS DRAWER */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", ease: "easeOut", duration: 0.3 }}
              className="relative w-full max-w-md theme-bg-card h-full shadow-2xl flex flex-col z-10 border-l theme-border"
            >
              {/* Header */}
              <div className="p-6 border-b theme-border flex justify-between items-center theme-bg-main">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <FiBriefcase size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-black theme-text-primary">Add New Project</h2>
                    <p className="text-[10px] theme-text-secondary font-bold uppercase tracking-wider mt-0.5">Project Details</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center theme-text-secondary hover:theme-text-primary transition-colors"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleCreateSubmit} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold theme-text-secondary uppercase tracking-wide">Project Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter project name..."
                      className="w-full px-4 py-3 rounded-2xl theme-bg-main border theme-border focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 text-sm theme-text-primary placeholder-slate-400 transition-all focus:shadow-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold theme-text-secondary uppercase tracking-wide">Client Name</label>
                    <div className="relative">
                      <select
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        className="w-full px-4 py-3 pr-10 rounded-2xl theme-bg-main border theme-border focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 text-sm theme-text-primary cursor-pointer appearance-none transition-all focus:shadow-sm"
                      >
                        {clients && clients.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.companyName}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none theme-text-secondary">
                        <FiChevronDown size={16} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold theme-text-secondary uppercase tracking-wide">Status</label>
                    <div className="relative">
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full px-4 py-3 pr-10 rounded-2xl theme-bg-main border theme-border focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 text-sm theme-text-primary cursor-pointer appearance-none transition-all focus:shadow-sm"
                      >
                        <option value="Active">Active</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Completed">Completed</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none theme-text-secondary">
                        <FiChevronDown size={16} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t theme-border theme-bg-main flex justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-5 py-3 rounded-2xl border theme-border theme-text-secondary text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-md shadow-blue-500/10 active:scale-95 transition-all"
                  >
                    Create Project
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Dashboardmain