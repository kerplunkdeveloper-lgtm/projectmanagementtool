import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { FiClock, FiCalendar, FiSun, FiMoon } from 'react-icons/fi'

const WelcomeUser = () => {
    const { user } = useSelector((state) => state.auth);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Real-time ticking clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Dynamic Greeting
    const hour = currentTime.getHours();
    let greeting = "Good evening";
    let Icon = FiMoon;
    let iconColor = "text-indigo-400";
    
    if (hour < 12) {
        greeting = "Good morning";
        Icon = FiSun;
        iconColor = "text-amber-500";
    } else if (hour < 18) {
        greeting = "Good afternoon";
        Icon = FiSun;
        iconColor = "text-amber-500";
    }

    // Formatting Date and Time
    const formattedDate = currentTime.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    const formattedTime = currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    return (
        <div className="relative overflow-hidden bg-white border border-slate-200 shadow-[0_4px_24px_rgba(0,0,0,0.02)] rounded-[2rem] p-6 md:p-8 mb-8 z-10 group">
            {/* Premium Background Blurs */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full blur-3xl opacity-60 z-0"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-gradient-to-tr from-blue-100 to-cyan-100 rounded-full blur-3xl opacity-60 z-0"></div>

            <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                
                {/* Left Side: Greeting & Role */}
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-slate-50 to-blue-50/50 border border-slate-100 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-500 flex-shrink-0">
                        <Icon className={`text-3xl ${iconColor}`} />
                    </div>
                    
                    <div>
                        <div className="flex flex-wrap items-center gap-3 mb-1.5">
                            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
                                {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">{user?.name || "User"}</span>
                            </h1>
                            <span className="px-3 py-1 bg-indigo-50 border border-indigo-100/50 text-indigo-600 text-[10px] font-black uppercase tracking-wider rounded-xl shadow-sm">
                                {user?.role || "Guest"}
                            </span>
                        </div>
                        <p className="text-slate-500 font-medium text-sm">Here is what's happening across your workspace today.</p>
                    </div>
                </div>

                {/* Right Side: Dynamic Clock & Date */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-[#f8fafc] border border-slate-100 p-3 rounded-2xl shadow-sm">
                    {/* Date Block */}
                    <div className="flex items-center gap-3 pr-5 sm:border-r border-slate-200">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 shadow-sm">
                            <FiCalendar size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Today's Date</p>
                            <p className="text-sm font-bold text-slate-700">{formattedDate}</p>
                        </div>
                    </div>
                    
                    {/* Time Block */}
                    <div className="flex items-center gap-3 pl-2 sm:pl-1">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-indigo-400 shadow-sm">
                            <FiClock size={18} />
                        </div>
                        <div className="min-w-[90px]">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Current Time</p>
                            <p className="text-sm font-bold text-slate-700 font-mono tracking-tight">{formattedTime}</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}

export default WelcomeUser