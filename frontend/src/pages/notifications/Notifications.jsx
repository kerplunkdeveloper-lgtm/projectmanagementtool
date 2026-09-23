import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiBell,
  FiCheckSquare,
  FiBriefcase,
  FiCheck,
  FiInfo,
  FiTrash2,
  FiInbox,
  FiMail,
  FiUser,
  FiFileText,
  FiVideo,
  FiCalendar,
  FiClock,
} from "react-icons/fi";
import {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} from "../../features/api/apiSlice";

const Notifications = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  // RTK Query hooks for Notifications API
  const { data: notifications = [], isLoading: loading } =
    useGetNotificationsQuery(undefined, {
      skip: !user,
      pollingInterval: 60000,
    });

  const [markAsReadTrigger] = useMarkAsReadMutation();
  const [markAllAsReadTrigger] = useMarkAllAsReadMutation();

  const [filter, setFilter] = useState("All"); // "All", "Unread", "Read"

  const handleMarkAsRead = (id) => {
    markAsReadTrigger(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadTrigger();
  };

  const unreadCount = (notifications || []).filter((n) => !n.isRead).length;

  const getNotificationDateMeta = (dateStr) => {
    if (!dateStr) return { label: "Earlier", type: "other" };
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { label: "Earlier", type: "other" };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const itemDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    const diffTime = today.getTime() - itemDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return { label: "Today", type: "today" };
    } else if (diffDays === 1) {
      return { label: "Yesterday", type: "yesterday" };
    } else {
      const isSameYear = d.getFullYear() === now.getFullYear();
      const label = d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        ...(isSameYear ? {} : { year: "numeric" }),
      });
      return { label, type: "other" };
    }
  };

  // Real-time ticker to keep "Just now" and "Xm ago" fresh automatically
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(timer);
  }, []);

  const getNotificationTimeInfo = (dateStr) => {
    if (!dateStr) return { text: "", isJustNow: false };
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { text: "", isJustNow: false };

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);

    // If within 60 seconds (or slight server clock drift), display "Just now"
    if (diffSec < 60) {
      return { text: "Just now", isJustNow: true };
    }

    // Under 60 minutes -> relative minutes (e.g. 5m ago)
    if (diffMin < 60) {
      return { text: `${diffMin}m ago`, isJustNow: false };
    }

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const itemDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffDays = Math.round(
      (today.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const timeStr = d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (diffDays <= 0) {
      return { text: `Today at ${timeStr}`, isJustNow: false };
    } else if (diffDays === 1) {
      return { text: `Yesterday at ${timeStr}`, isJustNow: false };
    } else {
      const dateFormatted = d.toLocaleDateString([], {
        month: "short",
        day: "numeric",
      });
      return { text: `${dateFormatted} at ${timeStr}`, isJustNow: false };
    }
  };

  const formatNotificationTime = (dateStr) => {
    return getNotificationTimeInfo(dateStr).text;
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "Unread") return !n.isRead;
    if (filter === "Read") return n.isRead;
    return true;
  });

  const groupedNotifications = useMemo(() => {
    if (!filteredNotifications || filteredNotifications.length === 0) return [];

    const sorted = [...filteredNotifications].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );

    const groups = [];
    let currentGroup = null;

    sorted.forEach((n) => {
      const meta = getNotificationDateMeta(n.createdAt);
      if (!currentGroup || currentGroup.label !== meta.label) {
        currentGroup = {
          label: meta.label,
          type: meta.type,
          items: [n],
        };
        groups.push(currentGroup);
      } else {
        currentGroup.items.push(n);
      }
    });

    return groups;
  }, [filteredNotifications]);

  const getSenderDepartment = (n) => {
    if (n?.sender?.department) return n.sender.department;

    // Smart fallback: parse department from message (e.g. "Graphic Designer - Manikandan updated...")
    if (n?.message && n.message.includes(" - ")) {
      const parts = n.message.split(" - ");
      const prefix = parts[0]?.trim();
      if (
        prefix &&
        prefix.length <= 30 &&
        !prefix.toLowerCase().includes("task") &&
        !prefix.toLowerCase().includes("client")
      ) {
        return prefix;
      }
    }

    if (n?.sender?.role) {
      if (n.sender.role === "admin") return "Admin";
      if (n.sender.role === "operationmanager") return "Operations";
    }

    return null;
  };

  const getDepartmentBadgeStyle = (dept) => {
    const d = (dept || "").toLowerCase().trim();
    if (d.includes("graphic") || d.includes("design")) {
      return "text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 border-purple-400 dark:border-purple-600";
    }
    if (
      d.includes("cinema") ||
      d.includes("video") ||
      d.includes("shoot") ||
      d.includes("editor")
    ) {
      return "text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-400 dark:border-amber-600";
    }
    if (d.includes("social") || d.includes("smm") || d.includes("media")) {
      return "text-pink-600 dark:text-pink-300 bg-pink-50 dark:bg-pink-950/50 border-pink-400 dark:border-pink-600";
    }
    if (
      d.includes("web") ||
      d.includes("dev") ||
      d.includes("code") ||
      d.includes("software")
    ) {
      return "text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border-blue-400 dark:border-blue-600";
    }
    if (d.includes("market") || d.includes("seo") || d.includes("growth")) {
      return "text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-400 dark:border-emerald-600";
    }
    if (d.includes("admin")) {
      return "text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border-rose-400 dark:border-rose-600";
    }
    if (d.includes("operation") || d.includes("manager")) {
      return "text-cyan-600 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/50 border-cyan-400 dark:border-cyan-600";
    }
    return "text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-400 dark:border-indigo-600";
  };

  const getNotificationDetails = (n) => {
    const type = n?.type;
    const message = n?.message || "";
    if (
      type === "client_assigned" ||
      message.toLowerCase().includes("client:")
    ) {
      return {
        icon: FiUser,
        bgColor: "bg-indigo-50 text-indigo-650 border-indigo-100",
      };
    }
    if (
      type === "report_submitted" ||
      (message &&
        (message
          .toLowerCase()
          .includes("submitted a new designer eod report") ||
          message.toLowerCase().includes("submitted a new eod report")))
    ) {
      return {
        icon: FiFileText,
        bgColor: "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100",
      };
    }
    switch (type) {
      case "project_assigned":
        return {
          icon: FiBriefcase,
          bgColor: "bg-amber-50 text-amber-600 border-amber-100",
        };
      case "task_assigned":
        return {
          icon: FiCheckSquare,
          bgColor: "bg-blue-50 text-blue-600 border-blue-100",
        };
      case "shoot_assigned":
        return {
          icon: FiVideo,
          bgColor: "bg-emerald-50 text-emerald-600 border-emerald-100",
        };
      case "task_completed":
        return {
          icon: FiCheck,
          bgColor: "bg-emerald-50 text-emerald-600 border-emerald-100",
        };
      case "task_updated":
        return {
          icon: FiInfo,
          bgColor: "bg-purple-50 text-purple-600 border-purple-100",
        };
      case "message_received":
        return {
          icon: FiMail,
          bgColor: "bg-teal-50 text-teal-600 border-teal-100",
        };
      case "report_submitted":
        return {
          icon: FiFileText,
          bgColor: "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100",
        };
      default:
        return {
          icon: FiBell,
          bgColor: "bg-slate-50 text-slate-600 border-slate-100",
        };
    }
  };

  return (
    <div className=" space-y-6 max-w-7xl mx-auto">
      {/* HEADER CARD */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full animate-pulse uppercase tracking-wider">
                {unreadCount} Unread
              </span>
            )}
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/70 border border-blue-100 transition-all duration-200"
          >
            <FiCheck className="text-sm" />
            Mark all as read
          </button>
        )}
      </div>

      {/* FILTER CONTROLS */}
      <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 w-fit">
        {["All", "Unread", "Read"].map((tab) => {
          const count =
            tab === "All"
              ? notifications.length
              : tab === "Unread"
                ? unreadCount
                : notifications.length - unreadCount;

          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-1.5 ${
                filter === tab
                  ? "bg-white text-slate-800 shadow-sm border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-850"
              }`}
            >
              <span>{tab}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                  filter === tab
                    ? "bg-slate-150 text-slate-700"
                    : "bg-slate-200/50 text-slate-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* NOTIFICATIONS LIST */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <FiInbox
            size={42}
            className="mx-auto text-slate-300 animate-bounce"
          />
          <h3 className="mt-4 text-sm font-black text-slate-750">
            Clean Inbox!
          </h3>
          <p className="text-slate-400 text-xs mt-1">
            No {filter.toLowerCase()} notifications found.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence initial={false}>
            {groupedNotifications.map((group) => (
              <div key={group.label} className="space-y-3">
                {/* Centered Date Separator Header */}
                <div className="flex items-center justify-center my-4 select-none">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />
                  <div
                    className={`
                      mx-3 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider
                      flex items-center gap-2 shadow-xs border
                      ${
                        group.type === "today"
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/50"
                          : group.type === "yesterday"
                          ? "bg-indigo-50/80 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-800/40"
                          : "bg-slate-100/90 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/60"
                      }
                    `}
                  >
                    {group.type === "today" ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    ) : group.type === "yesterday" ? (
                      <FiClock size={12} className="text-indigo-500 dark:text-indigo-400" />
                    ) : (
                      <FiCalendar size={12} className="text-slate-400 dark:text-slate-400" />
                    )}
                    <span>{group.label}</span>
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />
                </div>

                {group.items.map((n) => {
                  const details = getNotificationDetails(n);
                  const Icon = details.icon;
                  return (
                    <motion.div
                      key={n._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => {
                        if (!n.isRead) {
                          handleMarkAsRead(n._id);
                        }
                        if (n.type === "message_received" || n.chatRoomId) {
                          navigate(`/${user?.role}/chat?id=${n.chatRoomId}`);
                        } else if (
                          n.type === "report_submitted" ||
                          (n.message &&
                            (n.message
                              .toLowerCase()
                              .includes("submitted a new designer eod report") ||
                              n.message
                                .toLowerCase()
                                .includes("submitted a new eod report")))
                        ) {
                          navigate(`/${user?.role}/eod-reports`);
                        } else if (
                          n.type === "shoot_assigned" ||
                          n.shoot ||
                          (n.message && n.message.toLowerCase().includes("shoot"))
                        ) {
                          navigate(`/${user?.role}/Shootcalendor`);
                        } else if (
                          n.type === "client_assigned" ||
                          (n.message && n.message.toLowerCase().includes("client:"))
                        ) {
                          navigate(`/${user?.role}/clients`);
                        } else if (n.type === "task_assigned") {
                          navigate(`/${user?.role}/tasks`);
                        } else if (n.type?.startsWith("task_")) {
                          if (n.project) {
                            const projectId =
                              typeof n.project === "object"
                                ? n.project._id
                                : n.project;
                            navigate(`/${user?.role}/projects?id=${projectId}`);
                          } else {
                            navigate(`/${user?.role}/tasks`);
                          }
                        } else if (n.project) {
                          const projectId =
                            typeof n.project === "object"
                              ? n.project._id
                              : n.project;
                          navigate(`/${user?.role}/projects?id=${projectId}`);
                        } else {
                          navigate(`/${user?.role}/tasks`);
                        }
                      }}
                      className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-start gap-4 relative group hover:shadow-md ${
                        !n.isRead
                          ? "bg-gradient-to-r from-blue-50/40 via-blue-50/20 to-white border-blue-200/60 shadow-sm"
                          : "bg-white border-slate-100 hover:bg-slate-50/50"
                      }`}
                    >
                      {/* SENDER PROFILE AVATAR OR TYPE ICON */}
                      <div className="relative shrink-0">
                        {n.sender?.profile?.profileImage?.url ? (
                          <img
                            src={n.sender.profile.profileImage.url}
                            alt={n.sender.name || "User"}
                            className="w-11 h-11 rounded-full object-cover border-2 border-indigo-500/20 shadow-md"
                          />
                        ) : n.sender?.name ? (
                          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-black shadow-md">
                            {n.sender.name.charAt(0).toUpperCase()}
                          </div>
                        ) : (
                          <div
                            className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 shadow-sm ${details.bgColor}`}
                          >
                            <Icon size={18} />
                          </div>
                        )}

                        {/* Floating badge for notification type */}
                        {(n.sender?.profile?.profileImage?.url || n.sender?.name) && (
                          <div
                            className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-white shadow-sm ${details.bgColor}`}
                          >
                            <Icon size={10} />
                          </div>
                        )}
                      </div>

                      {/* MESSAGE AND TIME */}
                      <div className="flex-1 space-y-1.5 pr-6">
                        {n.sender?.name && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-lg border border-indigo-200/50 dark:border-indigo-800/40">
                              {n.sender.name}
                            </span>
                            {(() => {
                              const dept = getSenderDepartment(n);
                              return dept ? (
                                <span
                                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border tracking-wider uppercase shadow-2xs ${getDepartmentBadgeStyle(
                                    dept,
                                  )}`}
                                >
                                  {dept}
                                </span>
                              ) : null;
                            })()}
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {n.type === "shoot_assigned" ? "Assigned Shoot" : n.type === "task_assigned" ? "Assigned task" : "Notification sent"}
                            </span>
                          </div>
                        )}

                        <p
                          className={`text-xs sm:text-sm leading-relaxed ${
                            !n.isRead
                              ? "text-slate-800 font-extrabold"
                              : "text-slate-600 font-medium"
                          }`}
                        >
                          {n.message}
                        </p>

                        {(() => {
                          const timeInfo = getNotificationTimeInfo(n.createdAt);
                          const exactTime = n.createdAt
                            ? new Date(n.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "";

                          if (timeInfo.isJustNow) {
                            return (
                              <span
                                title={exactTime}
                                className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1.5 pt-0.5"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0 shadow-sm shadow-emerald-500/50" />
                                <span>Just now</span>
                              </span>
                            );
                          }

                          return (
                            <span
                              title={exactTime}
                              className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5 pt-0.5"
                            >
                              <FiClock className="shrink-0 text-slate-400" size={11} />
                              <span>{timeInfo.text}</span>
                            </span>
                          );
                        })()}
                      </div>

                      {/* STATUS DOT / UNREAD HIGHLIGHT */}
                      {!n.isRead && (
                        <span className="absolute top-1/2 -translate-y-1/2 right-4 w-2 h-2 rounded-full bg-blue-600 shadow-lg shadow-blue-500/50 animate-pulse" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Notifications;
