import React, { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { FiArrowLeft } from "react-icons/fi";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import useSocket from "../../hooks/useSocket.jsx";
import { exitImpersonation } from "../../features/auth/authSlice";
import { apiSlice } from "../../features/api/apiSlice";
import { fetchUnreadChatCounts } from "../../features/chat/chatSlice";
import HorizontalSidebar from "./HorizontalSidebar";
import { useTheme } from "../../context/ThemeContext";
import { usePresence } from "../../hooks/usePresence";
import { SocketProvider, useSocketContext } from "../../context/SocketContext";

// Inner layout — has access to SocketProvider
const DashboardLayoutInner = ({ role }) => {
  const { sidebarLayout } = useTheme();
  const { socket: sharedSocket } = useSocketContext() || {};
  const notifSocket = useSocket(sharedSocket);      // handles notifications, task_updated etc. on shared single socket
  const { user, originalAdminUser } = useSelector((state) => state.auth);
  const { profile } = useSelector((state) => state.profile || {});
  const { users } = useSelector((state) => state.users || {});
  // usePresence uses sharedSocket so heartbeat goes on the correct connection
  usePresence(sharedSocket, user?._id || user?.id);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getAvatarUrl = (targetUser, targetProfile) => {
    if (targetProfile?.profileImage?.url) return targetProfile.profileImage.url;
    if (targetUser?.profileImage?.url) return targetUser.profileImage.url;
    if (typeof targetUser?.profileImage === "string") return targetUser.profileImage;
    if (targetUser?.profile?.profileImage?.url) return targetUser.profile.profileImage.url;
    if (typeof targetUser?.profile?.profileImage === "string") return targetUser.profile.profileImage;
    if (users && users.length > 0 && targetUser) {
      const match = users.find(
        (u) =>
          (targetUser._id && (u._id === targetUser._id || u.id === targetUser._id)) ||
          (targetUser.id && (u._id === targetUser.id || u.id === targetUser.id)) ||
          (targetUser.email && u.email === targetUser.email)
      );
      if (match?.profile?.profileImage?.url) return match.profile.profileImage.url;
      if (match?.profileImage?.url) return match.profileImage.url;
      if (typeof match?.profileImage === "string") return match.profileImage;
    }
    return null;
  };

  const currentUserAvatar = getAvatarUrl(user, profile);
  const adminUserAvatar = getAvatarUrl(originalAdminUser, null);
  const isChatPage =
    location.pathname.endsWith("/chat") || location.pathname.includes("/chat");
  const isContentCalendarPage =
    location.pathname.includes("/content-calendar") ||
    location.pathname.includes("/content-calendor");
  const isSmTaskPage =
    location.pathname.includes("/sm-task") ||
    location.pathname.includes("/sm-tasks");
  const isStatusOverviewPage = location.pathname.includes("/status-overview");
  const hideNavbar =
    isChatPage ||
    isContentCalendarPage ||
    isSmTaskPage ||
    isStatusOverviewPage;
  const [sidebarOpen, setSidebarOpen] = useState(
    () => window.innerWidth >= 1024,
  );
  const mainContainerRef = useRef(null);

  // Fetch unread chat counts from server on initial mount / user change
  useEffect(() => {
    if (user?._id || user?.id) {
      dispatch(fetchUnreadChatCounts());
    }
  }, [dispatch, user?._id, user?.id]);

  // Core page chunks are now preloaded on hover in the Sidebar instead of all at once here.
  useEffect(() => {
    // preloadAllRoutes(); removed to prevent main thread blocking
  }, []);

  // Reset scroll position to top when navigating to a new page
  useEffect(() => {
    if (mainContainerRef.current) {
      mainContainerRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  const handleSwitchBack = () => {
    dispatch(exitImpersonation());
    dispatch(apiSlice.util.resetApiState());
    toast.success("Returned to Admin account");
    navigate("/admin");
  };

  return (
    <div className="h-screen overflow-hidden theme-bg-main relative">
      {/* Glassmorphic Background Blobs */}
      <div className="fixed top-[-10%] left-[-10%] w-[350px] h-[350px] rounded-full bg-gradient-to-br from-blue-400/20 to-indigo-500/20 blur-[80px] pointer-events-none z-0 dark:from-indigo-500/10 dark:to-[#3b82f6]/5" />
      <div className="fixed bottom-[20%] left-[-5%] w-[250px] h-[250px] rounded-full bg-gradient-to-br from-pink-400/10 to-purple-500/15 blur-[60px] pointer-events-none z-0 dark:from-purple-500/5 dark:to-blue-500/5" />
      
      {/* SIDEBAR */}
      {sidebarLayout === "vertical" && (
        <Sidebar
          role={role}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
      )}
      {sidebarLayout === "horizontal" && sidebarOpen && (
        <div className="lg:hidden">
          <Sidebar
            role={role}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
        </div>
      )}

      {/* RIGHT SIDE / MAIN CONTENT */}
      <div
        className={`flex-1 h-screen flex flex-col relative z-10 transition-all duration-300 ease-in-out ${
          sidebarLayout === "vertical"
            ? sidebarOpen
              ? "lg:ml-52"
              : "lg:ml-16"
            : "lg:ml-0"
        }`}
      >
        {/* IMPERSONATION BANNER */}
        {originalAdminUser && (
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 dark:from-[#1d4ed8] dark:via-[#1e40af] dark:to-[#172554] text-white px-4 py-2 text-xs flex items-center justify-between gap-4 shadow-md z-50 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2.5 flex-wrap min-w-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/25 border border-white/20 text-[10px] font-extrabold tracking-wider uppercase shrink-0 text-white shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                Viewing as
              </span>

              {/* Impersonated User Profile Badge */}
              <div className="inline-flex items-center gap-2 bg-white/15 dark:bg-black/30 border border-white/20 px-2.5 py-1 rounded-full shadow-2xs shrink-0">
                <div className="w-5 h-5 rounded-full overflow-hidden bg-white/20 ring-1 ring-white/50 shrink-0 flex items-center justify-center text-[9px] font-black text-white shadow-2xs">
                  {currentUserAvatar ? (
                    <img
                      src={currentUserAvatar}
                      alt={user?.name || "User"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <span>{getInitials(user?.name)}</span>
                  )}
                </div>
                <span className="font-extrabold text-[11.5px] text-white tracking-tight">
                  {user?.name}
                </span>
                <span className="text-[10px] font-bold text-blue-100 bg-white/15 px-1.5 py-0.5 rounded-md">
                  ({role || user?.role})
                </span>
              </div>

              <span className="text-[11px] text-blue-100/90 font-medium shrink-0">
                in Original account:
              </span>

              {/* Original Admin Account Badge */}
              <div className="inline-flex items-center gap-2 bg-amber-400/20 dark:bg-amber-950/40 border border-amber-300/40 px-2.5 py-1 rounded-full shadow-2xs shrink-0">
                <div className="w-5 h-5 rounded-full overflow-hidden bg-amber-400/30 ring-1 ring-amber-300/60 shrink-0 flex items-center justify-center text-[9px] font-black text-amber-200 shadow-2xs">
                  {adminUserAvatar ? (
                    <img
                      src={adminUserAvatar}
                      alt={originalAdminUser?.name || "Admin"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <span>{getInitials(originalAdminUser?.name)}</span>
                  )}
                </div>
                <span className="font-extrabold text-[11.5px] text-amber-200">
                  {originalAdminUser?.name}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSwitchBack}
              className="bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-blue-700 dark:text-blue-300 active:scale-95 text-[11px] font-extrabold px-3 py-1.5 rounded-lg shadow-sm transition-all duration-150 cursor-pointer flex items-center gap-1.5 shrink-0 uppercase tracking-wider"
              title={`Return to ${originalAdminUser?.name}`}
            >
              <FiArrowLeft size={13} className="stroke-[3]" />
              <span>Switch Back</span>
            </button>
          </div>
        )}

        {/* NAVBAR */}
        {!hideNavbar && (
          <Navbar
            setSidebarOpen={setSidebarOpen}
            sidebarOpen={sidebarOpen}
          />
        )}

        {/* HORIZONTAL SIDEBAR */}
        {sidebarLayout === "horizontal" && (
          <div className="hidden lg:block sticky top-0 z-40 bg-white pb-2 shrink-0">
            <HorizontalSidebar role={role} />
          </div>
        )}
        {/* SCROLLABLE CONTENT */}
        <main
          ref={mainContainerRef}
          className={`flex-1 ${isChatPage ? "overflow-hidden p-0" : "overflow-y-auto "} theme-bg-main`}
        >
          <div
            className={
              isChatPage
                ? "h-full theme-bg-card"
                : `min-h-full ${
                    sidebarLayout === "horizontal" ? "max-w-8xl mt-20  " : "max-w-8xl "
                  } mx-auto w-full dark:shadow-none p-2 sm:p-3 md:p-2`
            }
          >
            <Outlet context={{ setSidebarOpen, sidebarOpen }} />
          </div>
        </main>
      </div>
    </div>
  );
};

// Outer wrapper — provides single shared socket to all child pages
const DashboardLayout = ({ role }) => (
  <SocketProvider>
    <DashboardLayoutInner role={role} />
  </SocketProvider>
);

export default DashboardLayout;
