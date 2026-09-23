import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useSelector } from "react-redux";

const SocketContext = createContext(null);

/**
 * SocketProvider — App-level single socket connection.
 * DashboardLayout-ல் wrap பண்ணு → எல்லா pages-லயும் same socket use ஆகும்.
 *
 * FIX: socket is stored in STATE (not just ref) so child components
 * re-render when the socket becomes available after async connect.
 */
export const SocketProvider = ({ children }) => {
  const { user } = useSelector((state) => state.auth);

  // socket stored in STATE so children re-render when it's ready
  const [socket, setSocket] = useState(null);

  // Global online presence state — all pages share this
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [userPresence, setUserPresence] = useState({}); // userId -> { status, lastSeen }

  useEffect(() => {
    const userId = user?._id || user?.id;
    if (!user || !userId) return;

    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    const socketUrl = baseUrl
      ? baseUrl
      : typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:5001";

    // Create socket only once per user session
    const socketInstance = io(socketUrl, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    // Store in state → triggers re-render so children can access it
    setSocket(socketInstance);

    // Emit join only after connected (correct timing)
    socketInstance.on("connect", () => {
      socketInstance.emit("join", userId);
    });

    // Full online list broadcast
    socketInstance.on("online_users_list", (userIds) => {
      setOnlineUserIds(Array.isArray(userIds) ? userIds.map((id) => id.toString()) : []);
    });

    // Full presence snapshot (sent on join)
    socketInstance.on("presence_state", (presenceMap) => {
      if (presenceMap && typeof presenceMap === "object") {
        setUserPresence(presenceMap);
      }
    });

    // Individual presence update
    socketInstance.on("user:presence", ({ userId: targetId, status, lastSeen }) => {
      if (!targetId) return;
      const idStr = targetId.toString();

      setUserPresence((prev) => ({
        ...prev,
        [idStr]: { status, lastSeen: lastSeen ? new Date(lastSeen) : new Date() },
      }));

      // "away" still treated as online — user may be in another software
      setOnlineUserIds((prev) => {
        if (status === "online" || status === "away") {
          return prev.includes(idStr) ? prev : [...prev, idStr];
        } else {
          // Only "offline" removes from online list
          return prev.filter((id) => id !== idStr);
        }
      });
    });

    return () => {
      socketInstance.disconnect();
      setSocket(null);
    };
  }, [user]);

  return (
    <SocketContext.Provider
      value={{
        socket,          // STATE-based → children re-render when socket is ready ✅
        onlineUserIds,
        userPresence,
        isOnline: (userId) => {
          if (!userId) return false;
          const idStr = userId.toString();
          const presenceStatus = userPresence[idStr]?.status;
          // "away" is still treated as online
          return (
            onlineUserIds.includes(idStr) ||
            presenceStatus === "online" ||
            presenceStatus === "away"
          );
        },
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

/** Hook to consume socket context */
export const useSocketContext = () => useContext(SocketContext);
