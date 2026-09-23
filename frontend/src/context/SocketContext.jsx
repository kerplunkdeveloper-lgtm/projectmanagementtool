import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useSelector } from "react-redux";

const SocketContext = createContext(null);

// Helper to compute clean socket URL
const getSocketUrl = () => {
  let baseUrl = import.meta.env.VITE_API_BASE_URL;

  // In live production browser environment (not running on localhost):
  if (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    // If baseUrl is pointing to localhost or missing, fallback to current origin
    if (!baseUrl || baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1")) {
      return window.location.origin;
    }
  }

  if (!baseUrl) {
    return typeof window !== "undefined" ? window.location.origin : "http://localhost:5001";
  }

  // Strip trailing /api and trailing slashes so Socket.io connects to root namespace
  return baseUrl.replace(/\/api\/?$/, "").replace(/\/+$/, "");
};

/**
 * SocketProvider — App-level single socket connection.
 * DashboardLayout-ல் wrap பண்ணு → எல்லா pages-லயும் same socket use ஆகும்.
 *
 * FIX: socket is stored in STATE (not just ref) so child components
 * re-render when the socket becomes available after async connect.
 */
export const SocketProvider = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  const userId = user?._id || user?.id;

  // socket stored in STATE so children re-render when it's ready
  const [socket, setSocket] = useState(null);

  // Global online presence state — all pages share this
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [userPresence, setUserPresence] = useState({}); // userId -> { status, lastSeen }

  useEffect(() => {
    if (!userId) return;

    const socketUrl = getSocketUrl();

    // Create socket only once per user session
    const socketInstance = io(socketUrl, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    // Store in state → triggers re-render so children can access it
    setSocket(socketInstance);

    // Emit join when connected (and on reconnect)
    socketInstance.on("connect", () => {
      socketInstance.emit("join", userId.toString());
    });

    if (socketInstance.io) {
      socketInstance.io.on("reconnect", () => {
        socketInstance.emit("join", userId.toString());
      });
    }

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
  }, [userId]);

  return (
    <SocketContext.Provider
      value={{
        socket,          // STATE-based → children re-render when socket is ready ✅
        onlineUserIds,
        userPresence,
        isOnline: (targetId) => {
          if (!targetId) return false;
          const idStr = targetId.toString();
          const presenceStatus = userPresence[idStr]?.status;
          // "away" is still treated as online
          return (
            onlineUserIds.some((id) => id.toString() === idStr) ||
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
