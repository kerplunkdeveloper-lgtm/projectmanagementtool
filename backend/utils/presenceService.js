const User = require('../models/User');
const UserDailyActivity = require('../models/UserDailyActivity');

const getTodayDateStr = (date = new Date()) => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

const handlePresenceChange = async (io, userId, newStatus, lastActivityAt = new Date()) => {
  try {
    if (!userId) return;

    const now = new Date();
    const todayStr = getTodayDateStr(now);
    const lastSeenDate = newStatus === 'online' ? now : (lastActivityAt || now);

    // 1. Update User document
    const updateFields = {
      presenceStatus: newStatus,
      lastSeen: lastSeenDate,
    };
    if (newStatus === 'online') {
      updateFields.lastActivityAt = now;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, select: 'name email role department profile presenceStatus lastSeen lastActivityAt' }
    );

    if (!user) return;

    // 2. Update UserDailyActivity document
    let activity = await UserDailyActivity.findOne({ user: userId, date: todayStr });

    if (!activity) {
      activity = new UserDailyActivity({
        user: userId,
        date: todayStr,
        firstLogin: now,
        lastSeen: now,
        status: newStatus,
        totalOnlineMs: 0,
        currentSessionStart: newStatus === 'online' ? now : null,
        sessions: newStatus === 'online' ? [{ start: now, end: null, durationMs: 0 }] : [],
      });
      await activity.save();
    } else {
      activity.lastSeen = now;
      if (!activity.firstLogin) {
        activity.firstLogin = now;
      }

      if (newStatus === 'online') {
        if (activity.status !== 'online' || !activity.currentSessionStart) {
          activity.status = 'online';
          activity.currentSessionStart = now;
          activity.sessions.push({
            start: now,
            end: null,
            durationMs: 0,
          });
        }
      } else if (newStatus === 'offline') {
        if (activity.currentSessionStart) {
          const sessionMs = Math.max(0, now.getTime() - new Date(activity.currentSessionStart).getTime());
          activity.totalOnlineMs = (activity.totalOnlineMs || 0) + sessionMs;
          activity.currentSessionStart = null;

          if (activity.sessions && activity.sessions.length > 0) {
            const lastSession = activity.sessions[activity.sessions.length - 1];
            if (!lastSession.end) {
              lastSession.end = now;
              lastSession.durationMs = sessionMs;
            }
          }
        }
        activity.status = 'offline';
      }
      await activity.save();
    }

    // 3. Broadcast presence change to all connected clients
    if (io) {
      io.emit('user:presence', {
        userId: userId.toString(),
        status: newStatus,
        lastSeen: user.lastSeen || lastSeenDate,
      });

      // Also broadcast team activity event so drawer can react instantly
      io.emit('team:activity:update', {
        userId: userId.toString(),
        status: newStatus,
        lastSeen: now,
        date: todayStr,
      });
    }
  } catch (err) {
    console.error('[PresenceService] Error handling presence change:', err);
  }
};

module.exports = {
  getTodayDateStr,
  handlePresenceChange,
};
