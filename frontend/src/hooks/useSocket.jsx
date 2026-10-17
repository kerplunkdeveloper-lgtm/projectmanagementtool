import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { addNotification } from "../features/notifications/notificationSlice";
import { logoutUser } from "../features/auth/authSlice";
import { apiSlice } from "../features/api/apiSlice";
import { incrementUnreadCount, receiveMessage } from "../features/chat/chatSlice";
import toast from "react-hot-toast";
import { FiBell, FiX, FiMessageSquare, FiArrowRight, FiFileText, FiBriefcase } from "react-icons/fi";
import { useSocketContext } from "../context/SocketContext";

import { playNotificationSound, playDirectMessageSound } from "../utils/sound";

const getSenderAvatar = (sender) => {
  if (!sender) return "";
  return (
    (typeof sender?.profile?.profileImage === "object"
      ? sender?.profile?.profileImage?.url
      : sender?.profile?.profileImage) ||
    (typeof sender?.profileImage === "object"
      ? sender?.profileImage?.url
      : sender?.profileImage) ||
    sender?.avatar ||
    ""
  );
};


let titleFlashInterval = null;
let originalTitle =
  typeof document !== "undefined" ? document.title : "Project Management Tool";

const flashTabTitle = (message) => {
  if (typeof window === "undefined") return;

  // Track dynamic tab titles updated by page navigation
  const currentDocTitle = document.title;
  if (currentDocTitle && !currentDocTitle.startsWith("🔔")) {
    originalTitle = currentDocTitle;
  }

  if (window.titleFlashInterval) {
    clearInterval(window.titleFlashInterval);
  }

  let showFlash = true;
  window.titleFlashInterval = setInterval(() => {
    document.title = showFlash
      ? `🔔 ${message}`
      : originalTitle || "Project Management Tool";
    showFlash = !showFlash;
  }, 1200);
};

const clearTabTitleFlash = () => {
  if (typeof window === "undefined") return;
  if (window.titleFlashInterval) {
    clearInterval(window.titleFlashInterval);
    window.titleFlashInterval = null;
    document.title = originalTitle || "Project Management Tool";
  }
};

// Clear title flash on user activity / focus (BUG-12 FIX: prevent duplicate listeners)
if (typeof window !== "undefined" && !window.__titleFlashListenersAttached) {
  window.__titleFlashListenersAttached = true;
  window.addEventListener("focus", clearTabTitleFlash);
  window.addEventListener("click", clearTabTitleFlash);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      clearTabTitleFlash();
    }
  });
}

const getSocketUrl = () => {
  let baseUrl = import.meta.env.VITE_API_BASE_URL;
  if (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    if (!baseUrl || baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1")) {
      return window.location.origin;
    }
  }
  if (!baseUrl) {
    return typeof window !== "undefined" ? window.location.origin : "http://localhost:5001";
  }
  return baseUrl.replace(/\/api\/?$/, "").replace(/\/+$/, "");
};

const useSocket = (externalSocket) => {
  const socket = useRef();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { activeChatId } = useSelector((state) => state.chat);
  const activeChatIdRef = useRef(activeChatId);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  const userId = user?._id || user?.id;
  const userRole = user?.role;
  const socketContext = useSocketContext?.();

  // If externalSocket was passed explicitly (even if null while waiting), prioritize it.
  // Otherwise, fallback to the socket from SocketContext.
  const activeSocket = externalSocket !== undefined ? externalSocket : socketContext?.socket;
  const isExternal = externalSocket !== undefined || Boolean(socketContext);

  useEffect(() => {
    if (userId) {
      // If an external/shared socket is expected but still connecting, wait for it
      if (isExternal && !activeSocket) {
        return;
      }

      let socketInstance = activeSocket;

      if (!isExternal) {
        const socketUrl = getSocketUrl();
        socketInstance = io(socketUrl, {
          transports: ["websocket", "polling"],
          withCredentials: true,
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 1000,
        });

        socketInstance.on("connect", () => {
          socketInstance.emit("join", userId.toString());
        });
      }

      socket.current = socketInstance;
      if (!socketInstance) return;

      const handleTaskUpdated = () => {
        dispatch(apiSlice.util.invalidateTags(["Task"]));
      };

      const handleAccountDeactivated = (data) => {
        toast.error(
          data?.message || "Your account has been deactivated. Please contact your administrator.",
          { duration: 6000, id: "account-deactivated-toast" }
        );
        dispatch(logoutUser());
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("originalRole");
        localStorage.removeItem("originalAdminUser");
        localStorage.removeItem("originalAdminToken");
        window.location.href = "/";
      };

      const handleDirectMessage = (msg) => {
        if (!msg) return;
        dispatch(receiveMessage({ message: msg, currentUserId: userId }));
      };

      const handleGroupMessage = (msg) => {
        if (!msg) return;
        dispatch(receiveMessage({ message: msg, currentUserId: userId }));
      };

      const handleNotification = (notification) => {
        if (!notification) return;

        // Skip own message notifications if looped back
        const senderId = notification.sender?._id || notification.sender;
        if (senderId && senderId.toString() === userId?.toString()) {
          return;
        }

        const isChatRelated =
          notification.type === "message_received" ||
          notification.type === "mention_received" ||
          notification.type === "reaction_received";

        if (isChatRelated) {
          // Play premium chat chime
          playDirectMessageSound();

          const isMention = notification.type === "mention_received";
          const isReaction = notification.type === "reaction_received";

          // Unread count is already accurately maintained by receiveMessage on direct_message / group_message events

          // If the user is currently viewing this exact chat conversation, suppress the popup
          if (
            activeChatIdRef.current &&
            notification.chatRoomId &&
            activeChatIdRef.current.toString() === notification.chatRoomId.toString()
          ) {
            return;
          }

          const senderName = notification.sender?.name || "Team Member";
          const senderAvatar = getSenderAvatar(notification.sender);
          const isGroup = notification.chatRoomType === "group" || notification.chatRoomId === "group";
          const roomName = notification.roomName || (isGroup ? "Kerplunk Group" : "Direct Message");

          // Clean message text preview
          let displayMessage = notification.messageData?.text || notification.message || "";
          if (notification.messageData?.messageType === "file") {
            displayMessage = `📁 Sent file: ${notification.messageData?.filename || "Attachment"}`;
          } else if (notification.messageData?.messageType === "sticker") {
            displayMessage = `🎨 Sent a sticker: ${notification.messageData?.sticker || "Sticker"}`;
          } else if (notification.messageData?.messageType === "call") {
            displayMessage = "📞 Started a Video/Audio Meeting";
          } else {
            displayMessage = displayMessage.replace(/^New message( in [^:]+)? from [^:]+: /, "");
            if (displayMessage.startsWith('"') && displayMessage.endsWith('"')) {
              displayMessage = displayMessage.slice(1, -1);
            }
          }

          // Flash tab title
          flashTabTitle(
            isReaction
              ? `${senderName} reacted to your message`
              : isMention
              ? `🔔 ${senderName} mentioned you!`
              : `New message from ${senderName}`
          );

          // Render High-End SaaS Floating Notification Popup Card
          toast.custom(
            (t) => (
              <div
                className={`${
                  t.visible ? "animate-enter" : "animate-leave"
                } max-w-[380px] w-full bg-white/95 dark:bg-[#0c1222]/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.18)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)] rounded-2xl pointer-events-auto border ${
                  isReaction
                    ? "border-amber-400/50 dark:border-amber-500/30"
                    : isMention
                    ? "border-amber-500/60 dark:border-amber-400/40"
                    : "border-slate-200/90 dark:border-slate-800/90 hover:border-indigo-400/50 dark:hover:border-indigo-500/40"
                } p-3.5 transition-all duration-200 hover:scale-[1.01] cursor-pointer relative group overflow-hidden`}
                onClick={() => {
                  toast.dismiss(t.id);
                  const targetUrl = `/${userRole || "team"}/chat?id=${notification.chatRoomId || ""}${
                    notification.messageId ? `&messageId=${notification.messageId}` : ""
                  }`;
                  navigate(targetUrl);
                }}
              >
                {/* Top Subtle Ambient Glow */}
                <div
                  className={`absolute top-0 left-0 right-0 h-[2.5px] ${
                    isReaction
                      ? "bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400"
                      : isMention
                      ? "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 animate-pulse"
                      : "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                  }`}
                />

                <div className="flex items-start gap-3">
                  {/* Sender Avatar with live status */}
                  <div className="relative shrink-0 pt-0.5">
                    {senderAvatar ? (
                      <img
                        src={senderAvatar}
                        alt={senderName}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-indigo-500/20 dark:ring-white/10 shadow-sm"
                      />
                    ) : (
                      <div
                        className={`w-11 h-11 rounded-full ${
                          isReaction
                            ? "bg-gradient-to-tr from-amber-400 to-orange-500"
                            : isMention
                            ? "bg-gradient-to-tr from-amber-500 to-orange-600"
                            : "bg-gradient-to-tr from-indigo-600 to-purple-600"
                        } flex items-center justify-center text-white text-sm font-black shadow-inner`}
                      >
                        {senderName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {/* Glowing Online Ring */}
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0c1222] shadow-xs" />
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0 pr-5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[13px] font-black text-slate-900 dark:text-white truncate max-w-[140px]">
                        {senderName}
                      </span>

                      {isReaction ? (
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border border-amber-300/40">
                          Reacted
                        </span>
                      ) : isMention ? (
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-500/25 border border-amber-400/50 animate-pulse">
                          📢 @Mention
                        </span>
                      ) : isGroup ? (
                        <span className="text-[9px] font-bold tracking-wide px-2 py-0.5 rounded-full text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/50 dark:border-indigo-800/50 truncate max-w-[110px]">
                          {roomName}
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold tracking-wide px-2 py-0.5 rounded-full text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/50 dark:border-emerald-800/50">
                          Direct
                        </span>
                      )}

                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium ml-auto">
                        Just now
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed line-clamp-2">
                      {displayMessage}
                    </p>

                    <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[11px]">
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <FiMessageSquare size={12} />
                        Open Conversation
                        <FiArrowRight size={11} className="transition-transform group-hover:translate-x-1" />
                      </span>
                      <span className="text-[10px] text-slate-400">Click to reply</span>
                    </div>
                  </div>
                </div>

                {/* Dismiss Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.dismiss(t.id);
                  }}
                  className="absolute top-3 right-3 w-6 h-6 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                  title="Dismiss"
                >
                  <FiX size={13} />
                </button>
              </div>
            ),
            {
              duration: 5000,
              position: "top-center",
              id: `chat-${notification._id || Date.now()}`,
            }
          );
        } else {
          // Play notification chime
          playNotificationSound();

          // Sync local notification store and force RTK Query refetch so the Navbar bell updates instantly
          dispatch(addNotification(notification));
          dispatch(apiSlice.util.invalidateTags(["Notification"]));

          // Flash tab title for system notifications
          flashTabTitle(`New Alert: ${notification.message}`);

          // Standard Alert Toast
          toast.custom(
            (t) => {
              const clientName =
                notification.clientName ||
                notification.client?.companyName ||
                notification.project?.client?.companyName ||
                notification.task?.project?.client?.companyName ||
                (notification.message?.match(/for client\s+["']?([^"'.\n]+)["']?/i)?.[1]?.trim());

              return (
                <div
                  className={`${
                    t.visible ? "animate-enter" : "animate-leave"
                  } max-w-[360px] w-full bg-white dark:bg-[#0f172a] shadow-xl border border-slate-200/80 dark:border-slate-800/90 rounded-xl pointer-events-auto flex items-start p-3 pr-8 relative cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors`}
                  onClick={() => {
                    toast.dismiss(t.id);
                    if (
                      notification.type === "shoot_assigned" ||
                      notification.shoot ||
                      (notification.message &&
                        notification.message.toLowerCase().includes("shoot"))
                    ) {
                      navigate(`/${userRole}/Shootcalendor`);
                    } else if (
                      notification.type?.startsWith("mom_") ||
                      notification.mom ||
                      (notification.message &&
                        notification.message.toLowerCase().includes("mom point"))
                    ) {
                      navigate(`/${userRole}/mom-points`);
                    } else if (
                      notification.type === "client_assigned" ||
                      (notification.message &&
                        notification.message.toLowerCase().includes("client:"))
                    ) {
                      navigate(`/${userRole}/clients`);
                    } else if (notification.type?.startsWith("task_")) {
                      if (notification.project) {
                        const projectId = typeof notification.project === 'object' ? notification.project._id : notification.project;
                        navigate(`/${userRole}/projects?id=${projectId}`);
                      } else {
                        navigate(`/${userRole}/tasks`);
                      }
                    }
                  }}
                >
                  {/* Sender Avatar or Icon */}
                  <div className="flex-shrink-0 relative mt-0.5">
                    {notification.sender?.profile?.profileImage?.url ? (
                      <img
                        src={notification.sender.profile.profileImage.url}
                        alt={notification.sender.name || "User"}
                        className="h-9 w-9 rounded-full object-cover border-2 border-indigo-500/20 shadow-sm"
                      />
                    ) : notification.sender?.name ? (
                      <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-black shadow-sm">
                        {notification.sender.name.charAt(0).toUpperCase()}
                      </div>
                    ) : (
                      <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-white shadow-sm">
                        <FiBell size={14} />
                      </div>
                    )}
                  </div>

                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {notification.sender?.name ? (
                        <>
                          <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 truncate">
                            {notification.sender.name}
                          </span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                            • {notification.type === "shoot_assigned"
                              ? "Shoot Assigned"
                              : notification.type === "mom_assigned"
                              ? "MOM Assigned"
                              : notification.type === "mom_created"
                              ? "New MOM Point"
                              : notification.type === "mom_updated"
                              ? "MOM Updated"
                              : notification.type === "mom_overdue"
                              ? "MOM Overdue"
                              : notification.type === "task_assigned"
                              ? "Task Assigned"
                              : notification.type?.startsWith("task_")
                              ? "Task Update"
                              : "Alert"}
                          </span>
                        </>
                      ) : (
                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                          System Alert
                        </p>
                      )}
                      {clientName && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 shadow-xs">
                          <FiBriefcase size={8} className="text-amber-600 dark:text-amber-400" />
                          <span className="truncate max-w-[120px]">{clientName}</span>
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] font-medium text-slate-800 dark:text-slate-100 leading-snug">
                      {notification.message}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toast.dismiss(t.id);
                    }}
                    className="absolute top-2.5 right-2.5 w-5 h-5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 transition-colors"
                  >
                    <FiX size={12} />
                  </button>
                </div>
              );
            },
            {
              duration: 3000,
              position: "top-center",
            },
          );
        }
      };

      socketInstance.on("task_updated", handleTaskUpdated);
      socketInstance.on("account_deactivated", handleAccountDeactivated);
      socketInstance.on("notification", handleNotification);
      socketInstance.on("direct_message", handleDirectMessage);
      socketInstance.on("group_message", handleGroupMessage);

      return () => {
        if (socketInstance) {
          socketInstance.off("task_updated", handleTaskUpdated);
          socketInstance.off("account_deactivated", handleAccountDeactivated);
          socketInstance.off("notification", handleNotification);
          socketInstance.off("direct_message", handleDirectMessage);
          socketInstance.off("group_message", handleGroupMessage);
          if (!isExternal) {
            socketInstance.disconnect();
          }
        }
      };
    }
  }, [userId, userRole, dispatch, navigate, activeSocket, isExternal]);

  return socket.current || activeSocket;
};

export default useSocket;
