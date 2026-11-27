const mongoose = require('mongoose');
const SmDailySchedule = require('../models/SmDailySchedule');
const User = require('../models/User');

// 15 Predefined Standard Slots for Social Media Executive Daily Work Schedule
const DEFAULT_SCHEDULE_SLOTS = [
  {
    slotId: 'slot-1',
    timeRange: '9:00 – 9:15 AM',
    startTime: '09:00',
    endTime: '09:15',
    title: 'WhatsApp Group Review',
    points: [
      'Check all client WhatsApp groups.',
      'Review new requests, updates, approvals and pending requirements.',
    ],
    benchmark: '',
    subtasks: [
      { id: 'slot-1-sub-1', text: 'Check all client WhatsApp groups' },
      { id: 'slot-1-sub-2', text: 'Review new requests, updates, approvals & pending requirements' },
    ],
  },
  {
    slotId: 'slot-2',
    timeRange: '9:15 – 9:30 AM',
    startTime: '09:15',
    endTime: '09:30',
    title: 'Designer & Videographer Work Allocation',
    points: [
      'Assign designer and videographer tasks.',
      'Review previous-day pending works.',
      'Schedule and prioritise today’s deliverables.',
    ],
    benchmark: '',
    subtasks: [
      { id: 'slot-2-sub-1', text: 'Assign designer and videographer tasks' },
      { id: 'slot-2-sub-2', text: 'Review previous-day pending works' },
      { id: 'slot-2-sub-3', text: 'Schedule and prioritise today’s deliverables' },
    ],
  },
  {
    slotId: 'slot-3',
    timeRange: '9:30 – 9:45 AM',
    startTime: '09:30',
    endTime: '09:45',
    title: 'Social Media Work Update',
    points: [
      'Review and update SM tasks client-wise.',
      'Ensure all tasks are properly sorted and prioritised for each client.',
    ],
    benchmark: '',
    subtasks: [
      { id: 'slot-3-sub-1', text: 'Review and update SM tasks client-wise' },
      { id: 'slot-3-sub-2', text: 'Ensure all tasks are properly sorted and prioritised for each client' },
    ],
  },
  {
    slotId: 'slot-4',
    timeRange: '9:45 – 10:30 AM',
    startTime: '09:45',
    endTime: '10:30',
    title: 'Story Posting & Engagement',
    points: [
      'Add and schedule the day’s stories.',
      'Ensure 1 CTA link is included.',
      'Add 1 quiz or poll-based story for engagement.',
    ],
    benchmark: 'Must include 1 CTA link + 1 quiz/poll-based story',
    subtasks: [
      { id: 'slot-4-sub-1', text: 'Add and schedule the day’s stories' },
      { id: 'slot-4-sub-2', text: 'Ensure 1 CTA link is included' },
      { id: 'slot-4-sub-3', text: 'Add 1 quiz or poll-based story for engagement' },
    ],
  },
  {
    slotId: 'slot-5',
    timeRange: '10:30 – 11:30 AM',
    startTime: '10:30',
    endTime: '11:30',
    title: 'Social Media Analytics Review',
    points: [
      'Capture and review story and post analytics.',
      'Analyse the last 3 posts: Likes, Comments, Reach/engagement, Follower growth.',
      'Identify content that is performing well and areas that need improvement.',
    ],
    benchmark: 'Review story analytics & last 3 posts performance metrics',
    subtasks: [
      { id: 'slot-5-sub-1', text: 'Capture and review story and post analytics' },
      { id: 'slot-5-sub-2', text: 'Analyse last 3 posts: Likes, Comments, Reach, Follower growth' },
      { id: 'slot-5-sub-3', text: 'Identify high-performing content & improvement areas' },
    ],
  },
  {
    slotId: 'slot-6',
    timeRange: '11:30 AM – 1:00 PM',
    startTime: '11:30',
    endTime: '13:00',
    title: 'Client Follow-ups & Execution',
    points: [
      'Review pending tasks for each client.',
      'Follow up on pending approvals and requirements.',
      'Execute MOM-based action points.',
      'Plan campaigns and offers for each client.',
      'Review and respond to GMB reviews.',
    ],
    benchmark: 'MOM execution & GMB review replies',
    subtasks: [
      { id: 'slot-6-sub-1', text: 'Review pending tasks for each client' },
      { id: 'slot-6-sub-2', text: 'Follow up on pending approvals & requirements' },
      { id: 'slot-6-sub-3', text: 'Execute MOM-based action points' },
      { id: 'slot-6-sub-4', text: 'Plan campaigns and offers for each client' },
      { id: 'slot-6-sub-5', text: 'Review and respond to GMB reviews' },
    ],
  },
  {
    slotId: 'slot-7',
    timeRange: '1:00 – 1:30 PM',
    startTime: '13:00',
    endTime: '13:30',
    title: 'First-Half Designer Work Review',
    points: [
      'Check all designers’ first-half work.',
      'Review completed, pending and ongoing tasks.',
      'Update and organise work status client-wise.',
    ],
    benchmark: '',
    subtasks: [
      { id: 'slot-7-sub-1', text: 'Check all designers’ first-half work' },
      { id: 'slot-7-sub-2', text: 'Review completed, pending and ongoing tasks' },
      { id: 'slot-7-sub-3', text: 'Update and organise work status client-wise' },
    ],
  },
  {
    slotId: 'slot-8',
    timeRange: '2:15 – 2:30 PM',
    startTime: '14:15',
    endTime: '14:30',
    title: 'Second-Half Work Planning',
    points: [
      'Plan and assign second-half tasks for designers and videographers.',
      'Re-prioritise urgent and deadline-based deliverables.',
    ],
    benchmark: '',
    subtasks: [
      { id: 'slot-8-sub-1', text: 'Plan & assign 2nd-half tasks for designers and videographers' },
      { id: 'slot-8-sub-2', text: 'Re-prioritise urgent and deadline deliverables' },
    ],
  },
  {
    slotId: 'slot-9',
    timeRange: '2:30 – 3:30 PM',
    startTime: '14:30',
    endTime: '15:30',
    title: 'Competitor Deep Scan',
    points: [
      'Research relevant competitors and identify: Offers, Content hooks, Campaign ideas, Collaborations, Trending strategies.',
    ],
    benchmark: '1 India-level competitor | 1 Global competitor | 3 Local competitors',
    subtasks: [
      { id: 'slot-9-sub-1', text: '1 India-level competitor scan (Offers, Hooks, Campaigns)' },
      { id: 'slot-9-sub-2', text: '1 Global competitor scan (Collaborations, Trends)' },
      { id: 'slot-9-sub-3', text: '3 Local competitors scan (Regional trends & strategies)' },
    ],
  },
  {
    slotId: 'slot-10',
    timeRange: '3:30 – 4:00 PM',
    startTime: '15:30',
    endTime: '16:00',
    title: 'Growth & Client Account Review',
    points: [
      'DM 3 Micro/Nano barter influencers per client for collaborations.',
      'Plan story additions, discount/gift-based collaborations.',
      'Conduct website audit.',
      'Check GMB updates and reviews.',
      'Update Instagram Highlights.',
      'Cross-check Facebook.',
      'QC the last 1 week of posts.',
      'Review sales reports.',
      'Handle client calls and follow-ups.',
    ],
    benchmark: 'DM 3 Micro/Nano barter influencers per client',
    subtasks: [
      { id: 'slot-10-sub-1', text: 'DM 3 Micro/Nano barter influencers per client' },
      { id: 'slot-10-sub-2', text: 'Plan story additions & discount/gift collaborations' },
      { id: 'slot-10-sub-3', text: 'Conduct website audit & check GMB updates' },
      { id: 'slot-10-sub-4', text: 'Update Instagram Highlights & cross-check Facebook' },
      { id: 'slot-10-sub-5', text: 'QC last 1 week of posts & review sales reports' },
      { id: 'slot-10-sub-6', text: 'Handle client calls and follow-ups' },
    ],
  },
  {
    slotId: 'slot-11',
    timeRange: '4:15 – 5:00 PM',
    startTime: '16:15',
    endTime: '17:00',
    title: 'Next-Day Content Planning',
    points: [
      'Plan next day’s story sequence.',
      'Brainstorm hooks for reels.',
      'Prepare the next day’s reel plan.',
      'Prepare tomorrow’s post caption.',
      'Research relevant reel trends and content formats.',
    ],
    benchmark: '',
    subtasks: [
      { id: 'slot-11-sub-1', text: 'Plan next day’s story sequence' },
      { id: 'slot-11-sub-2', text: 'Brainstorm hooks for reels & reel plan' },
      { id: 'slot-11-sub-3', text: 'Prepare tomorrow’s post caption' },
      { id: 'slot-11-sub-4', text: 'Research relevant reel trends and content formats' },
    ],
  },
  {
    slotId: 'slot-12',
    timeRange: '5:00 – 5:15 PM',
    startTime: '17:00',
    endTime: '17:15',
    title: 'Designer & Videographer Work Review',
    points: [
      'Check the day’s completed and pending work.',
      'Ensure priority deliverables are on track.',
    ],
    benchmark: '',
    subtasks: [
      { id: 'slot-12-sub-1', text: 'Check the day’s completed and pending work' },
      { id: 'slot-12-sub-2', text: 'Ensure priority deliverables are on track' },
    ],
  },
  {
    slotId: 'slot-13',
    timeRange: '5:15 – 5:30 PM',
    startTime: '17:15',
    endTime: '17:30',
    title: 'Final QC & Client Group Update',
    points: [
      'QC today’s post.',
      'Share the approved post/content in the respective client group.',
    ],
    benchmark: '',
    subtasks: [
      { id: 'slot-13-sub-1', text: 'QC today’s post thoroughly' },
      { id: 'slot-13-sub-2', text: 'Share approved post/content in respective client WhatsApp group' },
    ],
  },
  {
    slotId: 'slot-14',
    timeRange: '5:30 – 5:45 PM',
    startTime: '17:30',
    endTime: '17:45',
    title: 'EOD Reporting',
    points: [
      'Prepare and share EOD reports for all client groups.',
      'Mention completed, pending and carry-forward tasks.',
    ],
    benchmark: 'Completed, pending & carry-forward tasks breakdown',
    subtasks: [
      { id: 'slot-14-sub-1', text: 'Prepare and share EOD reports for all client groups' },
      { id: 'slot-14-sub-2', text: 'Mention completed, pending and carry-forward tasks' },
    ],
  },
  {
    slotId: 'slot-15',
    timeRange: '5:45 – 6:00 PM',
    startTime: '17:45',
    endTime: '18:00',
    title: 'Daily Team Meeting',
    points: [
      'Review the day’s execution.',
      'Discuss pending/blocked tasks.',
      'Confirm priorities and responsibilities for the next day.',
    ],
    benchmark: '',
    subtasks: [
      { id: 'slot-15-sub-1', text: 'Review the day’s execution' },
      { id: 'slot-15-sub-2', text: 'Discuss pending / blocked tasks' },
      { id: 'slot-15-sub-3', text: 'Confirm priorities & responsibilities for next day' },
    ],
  },
];

const TOTAL_SLOTS = DEFAULT_SCHEDULE_SLOTS.length;

// Slot times are business-local wall-clock times (IST by default). The server may run in UTC,
// so every time calculation is done with an explicit offset instead of the server's local timezone.
const rawOffset = (process.env.SCHEDULE_TZ_OFFSET_MINUTES || '').trim();
const SCHEDULE_TZ_OFFSET_MINUTES =
  rawOffset !== '' && Number.isFinite(Number(rawOffset)) ? Number(rawOffset) : 330; // IST = UTC+5:30
const GRACE_PERIOD_MS = 15 * 60 * 1000;
const MAX_SAVE_ATTEMPTS = 5;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// "Today" (YYYY-MM-DD) in the schedule timezone
const getTodayStr = () => {
  const shifted = new Date(Date.now() + SCHEDULE_TZ_OFFSET_MINUTES * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
};

const isValidDateStr = (str) => {
  if (typeof str !== 'string' || !DATE_REGEX.test(str)) return false;
  const [y, m, d] = str.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
};

// Absolute timestamp (ms) for a "HH:mm" wall-clock time on a YYYY-MM-DD date in the schedule timezone
const toScheduleTimestamp = (dateStr, timeStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [h, m] = (timeStr || '00:00').split(':').map(Number);
  return Date.UTC(year, month - 1, day, h, m, 0, 0) - SCHEDULE_TZ_OFFSET_MINUTES * 60 * 1000;
};

const parseBoolean = (value) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return Boolean(value);
};

const formatSlotStart = (slot) => slot.timeRange?.split('–')[0]?.trim() || slot.startTime;

// Helper to determine role permissions
const isLeadershipUser = (user) => {
  if (!user) return false;
  const role = (user.role || '').toLowerCase().replace(/[\s_]/g, '');
  const dept = (user.department || '').toLowerCase().trim();
  const desig = (user.designation || '').toLowerCase().trim();

  return (
    role === 'admin' ||
    role === 'operationmanager' ||
    role === 'socialmediamanager' ||
    role === 'socialmediahead' ||
    dept.includes('admin') ||
    dept.includes('operation') ||
    dept.includes('social media head') ||
    desig.includes('social media head') ||
    (dept.includes('social media') && (role.includes('head') || desig.includes('head') || role.includes('manager')))
  );
};

// Resolve whose schedule is being read/changed. Only leadership may target another user.
const resolveTargetUserId = (req, requestedUserId) => {
  const isLead = isLeadershipUser(req.user);
  if (isLead && requestedUserId) {
    if (!mongoose.isValidObjectId(requestedUserId)) {
      return { error: { status: 400, message: 'Invalid userId' } };
    }
    return { isLead, targetUserId: requestedUserId };
  }
  return { isLead, targetUserId: req.user._id };
};

// On-time = completed after the slot started and no later than slot end + 15 min grace
const calculateTimingStatus = (dateStr, startTimeStr, endTimeStr, completedAt) => {
  if (!completedAt) return { isOnTime: false, timingStatus: 'pending' };

  const slotStart = toScheduleTimestamp(dateStr, startTimeStr);
  const graceEnd = toScheduleTimestamp(dateStr, endTimeStr) + GRACE_PERIOD_MS;
  const checkTime = new Date(completedAt).getTime();

  if (!Number.isFinite(slotStart) || !Number.isFinite(graceEnd) || !Number.isFinite(checkTime)) {
    return { isOnTime: false, timingStatus: 'delayed' };
  }
  if (checkTime < slotStart) {
    // Completion before the slot is blocked by the API; legacy data is still flagged as early
    return { isOnTime: false, timingStatus: 'early' };
  }
  if (checkTime <= graceEnd) {
    return { isOnTime: true, timingStatus: 'on-time' };
  }
  return { isOnTime: false, timingStatus: 'delayed' };
};

// A slot cannot be completed before it starts (and never on a future date)
const getCompletionBlockReason = (dateStr, slot) => {
  if (dateStr > getTodayStr()) {
    return 'You cannot complete slots for a future date';
  }
  if (Date.now() < toScheduleTimestamp(dateStr, slot.startTime)) {
    return `"${slot.title}" starts at ${formatSlotStart(slot)}. You can mark it once the slot begins.`;
  }
  return null;
};

const markSlotCompleted = (slot, dateStr, user, now) => {
  slot.completed = true;
  slot.completedAt = now;
  slot.completedBy = user._id;
  slot.completedByName = user.name || '';
  const { isOnTime, timingStatus } = calculateTimingStatus(dateStr, slot.startTime, slot.endTime, now);
  slot.isOnTime = isOnTime;
  slot.timingStatus = timingStatus;
};

const markSlotPending = (slot) => {
  slot.completed = false;
  slot.completedAt = null;
  slot.completedBy = null;
  slot.completedByName = '';
  slot.isOnTime = false;
  slot.timingStatus = 'pending';
};

// Recalculate schedule counts and statistics.
// Timing is re-derived from completedAt so records saved with the old (server-timezone) logic get corrected.
const recalculateScheduleStats = (doc) => {
  let completed = 0;
  let onTime = 0;
  let delayed = 0;

  (doc.slots || []).forEach((s) => {
    if (s.completed && s.completedAt && isValidDateStr(doc.date)) {
      const { isOnTime, timingStatus } = calculateTimingStatus(doc.date, s.startTime, s.endTime, s.completedAt);
      if (s.isOnTime !== isOnTime) s.isOnTime = isOnTime;
      if (s.timingStatus !== timingStatus) s.timingStatus = timingStatus;
    }
    if (s.completed) {
      completed++;
      if (s.timingStatus === 'on-time') {
        onTime++;
      } else {
        delayed++;
      }
    }
  });

  doc.completedSlotsCount = completed;
  doc.totalSlotsCount = doc.slots?.length || TOTAL_SLOTS;
  doc.completionPercentage = doc.totalSlotsCount > 0
    ? Math.round((completed / doc.totalSlotsCount) * 100)
    : 0;
  doc.onTimeSlotsCount = onTime;
  doc.delayedSlotsCount = delayed;
};

const buildDefaultSlots = () =>
  DEFAULT_SCHEDULE_SLOTS.map((slot) => ({
    ...slot,
    points: [...slot.points],
    completed: false,
    completedAt: null,
    completedBy: null,
    completedByName: '',
    isOnTime: false,
    timingStatus: 'pending',
    notes: '',
    subtasks: slot.subtasks.map((st) => ({
      ...st,
      completed: false,
      completedAt: null,
    })),
  }));

const buildEmptyStats = () => ({
  completedSlotsCount: 0,
  totalSlotsCount: TOTAL_SLOTS,
  completionPercentage: 0,
  onTimeSlotsCount: 0,
  delayedSlotsCount: 0,
});

// Internal helper to get or initialize document on demand when saving/toggling
const getOrInitScheduleDoc = async (userId, date) => {
  const schedule = await SmDailySchedule.findOne({ user: userId, date });
  if (schedule) return schedule;

  const targetUser = await User.findById(userId).select('name department').lean();
  if (!targetUser) return null;

  return new SmDailySchedule({
    user: userId,
    userName: targetUser.name || '',
    userDepartment: targetUser.department || 'Social Media Executive',
    date,
    slots: buildDefaultSlots(),
    ...buildEmptyStats(),
  });
};

/**
 * Load (or create) the schedule, apply `mutator`, recalculate stats and save.
 * Concurrent requests are safe: the schema uses optimistic concurrency, so a stale write
 * (VersionError) or a duplicate first-time insert (E11000) is retried on fresh data.
 */
const mutateSchedule = async (userId, date, mutator) => {
  for (let attempt = 1; attempt <= MAX_SAVE_ATTEMPTS; attempt++) {
    const schedule = await getOrInitScheduleDoc(userId, date);
    if (!schedule) return { error: { status: 404, message: 'User not found' } };

    const result = mutator(schedule) || {};
    if (result.error) return result;

    recalculateScheduleStats(schedule);
    try {
      await schedule.save();
      return { ...result, schedule };
    } catch (err) {
      const isConflict = err?.name === 'VersionError' || err?.code === 11000;
      if (!isConflict || attempt === MAX_SAVE_ATTEMPTS) throw err;
    }
  }
  return { error: { status: 409, message: 'Schedule was updated elsewhere, please retry' } };
};

/**
 * @desc Get Daily Work Schedule for a user and date (0 DB writes when no schedule exists yet)
 * @route GET /api/socialmedia-task-calendar/daily-schedule
 */
exports.getDailySchedule = async (req, res) => {
  try {
    const { isLead, targetUserId, error } = resolveTargetUserId(req, req.query.userId);
    if (error) return res.status(error.status).json({ success: false, message: error.message });

    const targetDate = isValidDateStr(req.query.date) ? req.query.date : getTodayStr();

    let schedule = await SmDailySchedule.findOne({ user: targetUserId, date: targetDate }).lean();
    let targetUser = null;

    if (schedule) {
      // Correct legacy timing statuses in the response (persisted on the next save)
      recalculateScheduleStats(schedule);
      targetUser = {
        _id: schedule.user,
        name: schedule.userName,
        department: schedule.userDepartment,
      };
    } else {
      targetUser = await User.findById(targetUserId).select('name email role department').lean();
      if (!targetUser) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Construct default schedule in memory without a DB write
      schedule = {
        user: targetUserId,
        userName: targetUser.name,
        userDepartment: targetUser.department || 'Social Media Executive',
        date: targetDate,
        slots: buildDefaultSlots(),
        ...buildEmptyStats(),
      };
    }

    return res.status(200).json({
      success: true,
      schedule,
      user: targetUser,
      date: targetDate,
      today: getTodayStr(),
      isLeadership: isLead,
    });
  } catch (error) {
    console.error('Error fetching Daily Schedule:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching daily schedule' });
  }
};

/**
 * @desc Toggle completion of a slot in Daily Work Schedule
 * @route PATCH /api/socialmedia-task-calendar/daily-schedule/toggle-slot
 */
exports.toggleSlotCompletion = async (req, res) => {
  try {
    const { date, slotId, notes } = req.body;
    if (!date || !slotId) {
      return res.status(400).json({ success: false, message: 'date and slotId are required' });
    }
    if (!isValidDateStr(date)) {
      return res.status(400).json({ success: false, message: 'date must be in YYYY-MM-DD format' });
    }
    if (notes !== undefined && (typeof notes !== 'string' || notes.length > 2000)) {
      return res.status(400).json({ success: false, message: 'notes must be text up to 2000 characters' });
    }

    const { targetUserId, error } = resolveTargetUserId(req, req.body.userId);
    if (error) return res.status(error.status).json({ success: false, message: error.message });

    const requestedCompleted = parseBoolean(req.body.completed);

    const result = await mutateSchedule(targetUserId, date, (schedule) => {
      const slot = schedule.slots.find((s) => s.slotId === slotId);
      if (!slot) return { error: { status: 404, message: 'Slot not found' } };

      const newCompleted = requestedCompleted !== undefined ? requestedCompleted : !slot.completed;

      if (newCompleted && !slot.completed) {
        const blockReason = getCompletionBlockReason(date, slot);
        if (blockReason) return { error: { status: 400, message: blockReason } };
      }

      const now = new Date();
      if (newCompleted) {
        // Keep the original completion time if the slot was already completed
        if (!slot.completed) markSlotCompleted(slot, date, req.user, now);
        (slot.subtasks || []).forEach((st) => {
          if (!st.completed) {
            st.completed = true;
            st.completedAt = now;
          }
        });
      } else {
        markSlotPending(slot);
        (slot.subtasks || []).forEach((st) => {
          st.completed = false;
          st.completedAt = null;
        });
      }

      if (notes !== undefined) slot.notes = notes;

      return { slot, newCompleted };
    });

    if (result.error) {
      return res.status(result.error.status).json({ success: false, message: result.error.message });
    }

    return res.status(200).json({
      success: true,
      message: `Slot "${result.slot.title}" ${result.newCompleted ? 'marked completed' : 'marked incomplete'}`,
      schedule: result.schedule,
      updatedSlot: result.slot,
    });
  } catch (error) {
    console.error('Error toggling slot completion:', error);
    return res.status(500).json({ success: false, message: 'Server error while toggling slot' });
  }
};

/**
 * @desc Toggle completion of a subtask within a slot
 * @route PATCH /api/socialmedia-task-calendar/daily-schedule/toggle-subtask
 */
exports.toggleSubtaskCompletion = async (req, res) => {
  try {
    const { date, slotId, subtaskId } = req.body;
    if (!date || !slotId || !subtaskId) {
      return res.status(400).json({ success: false, message: 'date, slotId and subtaskId are required' });
    }
    if (!isValidDateStr(date)) {
      return res.status(400).json({ success: false, message: 'date must be in YYYY-MM-DD format' });
    }

    const { targetUserId, error } = resolveTargetUserId(req, req.body.userId);
    if (error) return res.status(error.status).json({ success: false, message: error.message });

    const requestedCompleted = parseBoolean(req.body.completed);

    const result = await mutateSchedule(targetUserId, date, (schedule) => {
      const slot = schedule.slots.find((s) => s.slotId === slotId);
      if (!slot) return { error: { status: 404, message: 'Slot not found' } };

      const subtask = (slot.subtasks || []).find((st) => st.id === subtaskId);
      if (!subtask) return { error: { status: 404, message: 'Subtask not found' } };

      const newCompleted = requestedCompleted !== undefined ? requestedCompleted : !subtask.completed;

      if (newCompleted && !subtask.completed) {
        const blockReason = getCompletionBlockReason(date, slot);
        if (blockReason) return { error: { status: 400, message: blockReason } };
      }

      const now = new Date();
      if (newCompleted !== Boolean(subtask.completed)) {
        subtask.completed = newCompleted;
        subtask.completedAt = newCompleted ? now : null;
      }

      // Slot is complete exactly when all of its subtasks are complete
      const allDone = slot.subtasks.length > 0 && slot.subtasks.every((st) => st.completed);
      if (allDone && !slot.completed) {
        markSlotCompleted(slot, date, req.user, now);
      } else if (!allDone && slot.completed) {
        markSlotPending(slot);
      }

      return { slot };
    });

    if (result.error) {
      return res.status(result.error.status).json({ success: false, message: result.error.message });
    }

    return res.status(200).json({
      success: true,
      schedule: result.schedule,
      updatedSlot: result.slot,
    });
  } catch (error) {
    console.error('Error toggling subtask:', error);
    return res.status(500).json({ success: false, message: 'Server error while toggling subtask' });
  }
};

/**
 * @desc Get overview summary of all Social Media Executives for a specific date (leadership only)
 * @route GET /api/socialmedia-task-calendar/daily-schedule/executives-summary
 */
exports.getExecutivesSummary = async (req, res) => {
  try {
    if (!isLeadershipUser(req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view executives summary' });
    }

    const targetDate = isValidDateStr(req.query.date) ? req.query.date : getTodayStr();

    const executives = await User.find({
      employmentStatus: { $ne: 'relieved' },
      $or: [
        { role: { $in: ['socialmediaexecutive', 'socialmediamanager'] } },
        { department: { $regex: /social media/i } },
        { department: { $regex: /\bsme\b/i } },
        { designation: { $regex: /social media/i } },
      ],
    })
      .select('_id name email role department profile')
      .populate({ path: 'profile', select: 'profileImage' })
      .lean();

    if (!executives || executives.length === 0) {
      return res.status(200).json({
        success: true,
        date: targetDate,
        totalExecutives: 0,
        summary: [],
      });
    }

    const execIds = executives.map((e) => e._id);

    const schedules = await SmDailySchedule.find({
      date: targetDate,
      user: { $in: execIds },
    })
      .select('user completedSlotsCount totalSlotsCount completionPercentage onTimeSlotsCount delayedSlotsCount slots.completedAt')
      .lean();

    const scheduleMap = new Map();
    schedules.forEach((s) => {
      if (s.user) scheduleMap.set(s.user.toString(), s);
    });

    const summary = executives.map((exec) => {
      const sched = scheduleMap.get(exec._id.toString());
      const totalSlots = sched?.totalSlotsCount || TOTAL_SLOTS;
      return {
        user: {
          _id: exec._id,
          name: exec.name,
          email: exec.email,
          role: exec.role,
          department: exec.department,
          profile: exec.profile,
        },
        hasStarted: Boolean(sched && sched.completedSlotsCount > 0),
        completedSlotsCount: sched ? sched.completedSlotsCount : 0,
        totalSlotsCount: totalSlots,
        completionPercentage: sched ? sched.completionPercentage : 0,
        onTimeSlotsCount: sched ? sched.onTimeSlotsCount : 0,
        delayedSlotsCount: sched ? sched.delayedSlotsCount : 0,
        isAllDone: Boolean(sched && sched.completedSlotsCount >= totalSlots),
        lastCompletedAt: sched?.slots?.reduce((latest, s) => {
          if (s.completedAt && (!latest || new Date(s.completedAt) > new Date(latest))) {
            return s.completedAt;
          }
          return latest;
        }, null) || null,
      };
    });

    return res.status(200).json({
      success: true,
      date: targetDate,
      totalExecutives: executives.length,
      summary,
    });
  } catch (error) {
    console.error('Error fetching executives summary:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching summary' });
  }
};

// Exposed for maintenance scripts and tests
exports._internal = {
  calculateTimingStatus,
  recalculateScheduleStats,
  toScheduleTimestamp,
  getTodayStr,
  isValidDateStr,
};
