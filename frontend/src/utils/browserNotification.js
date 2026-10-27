/**
 * browserNotification.js
 * Utilities for HTML5 Web Notifications and Tab Title Alerts for Water Reminders
 */

let activeNotification = null;
let originalDocumentTitle = "";
let titleBlinkInterval = null;

/**
 * Check if the browser supports Desktop Notifications
 */
export const isNotificationSupported = () => {
  return typeof window !== "undefined" && "Notification" in window;
};

/**
 * Get current notification permission state ('granted', 'denied', 'default', or 'unsupported')
 */
export const getNotificationPermission = () => {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
};

/**
 * Request notification permission from the user
 */
export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) return false;
  try {
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;
    const permission = await Notification.requestPermission();
    return permission === "granted";
  } catch (err) {
    console.warn("Error requesting notification permission:", err);
    return false;
  }
};

/**
 * Display a native desktop notification when water reminder triggers
 */
export const showWaterDesktopNotification = ({
  title = "💧 Time to drink water!",
  body = "Take a quick hydration break to stay energized and focused.",
  onClick,
} = {}) => {
  if (!isNotificationSupported()) return null;
  if (Notification.permission !== "granted") return null;

  try {
    // Close existing notification if one is already open
    if (activeNotification) {
      activeNotification.close();
      activeNotification = null;
    }

    const options = {
      body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: "water-break-reminder",
      renotify: true,
      requireInteraction: true,
      silent: false,
    };

    const notification = new Notification(title, options);
    activeNotification = notification;

    notification.onclick = () => {
      try {
        window.focus();
      } catch {}
      if (typeof onClick === "function") {
        onClick();
      }
      notification.close();
      activeNotification = null;
    };

    notification.onclose = () => {
      if (activeNotification === notification) {
        activeNotification = null;
      }
    };

    return notification;
  } catch (err) {
    console.warn("Failed to show desktop notification:", err);
    return null;
  }
};

/**
 * Close any active desktop notification
 */
export const closeWaterDesktopNotification = () => {
  try {
    if (activeNotification) {
      activeNotification.close();
      activeNotification = null;
    }
  } catch {}
};

/**
 * Start blinking the document title when the tab is in background
 */
export const startTitleBlink = (alertTitle = "💧 Drink Water! (Break Time)") => {
  if (typeof document === "undefined") return;

  // Save the original title if not already saved
  if (!originalDocumentTitle) {
    originalDocumentTitle = document.title || "Project Management Tool";
  }

  // Clear existing interval if running
  if (titleBlinkInterval) {
    clearInterval(titleBlinkInterval);
  }

  let isAlertState = true;
  document.title = alertTitle;

  titleBlinkInterval = setInterval(() => {
    // If user returns to tab and document becomes visible, we can either keep or restore
    isAlertState = !isAlertState;
    document.title = isAlertState ? alertTitle : (originalDocumentTitle || "Project Management Tool");
  }, 1200);
};

/**
 * Stop blinking the document title and restore original title
 */
export const stopTitleBlink = () => {
  if (typeof document === "undefined") return;

  if (titleBlinkInterval) {
    clearInterval(titleBlinkInterval);
    titleBlinkInterval = null;
  }

  if (originalDocumentTitle) {
    document.title = originalDocumentTitle;
    originalDocumentTitle = "";
  }
};
