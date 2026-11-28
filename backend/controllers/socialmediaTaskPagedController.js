const SocialmediaTaskCalendor = require('../models/SocialmediaTaskCalendor');
const User = require('../models/User');
const { isSocialMediaHeadUser } = require('../utils/smHeadBranch');
const {
  escapeRegex,
  ciExact,
  ciOneOf,
  getRoleFlags,
  loadClientScopes,
  buildChennaiCondition,
  buildInactiveExclusion,
  buildBranchCondition,
} = require('../utils/smTaskQuery');

// Server-side filtered + paginated task list for the SM Tasks page.
// Each filter mirrors the client-side rule SmTasks.jsx used to apply over the full task
// list, so results are the same — only the work (and the payload) moved to the database.

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const MAX_EXPORT = 5000;

const DATE_FIELD_MAP = { publish: 'publishDate', due: 'dueDate', created: 'createdAt' };

// "Done" statuses for At Risk — same set as AT_RISK_DONE_STATUSES in smCommitmentUtils.js
const AT_RISK_DONE = ['completed', 'live', 'published', 'published live', 'completed and wait client approval'];

const isAll = (v) => v === undefined || v === null || v === '' || v === 'All' || v === 'all';

const parseDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

const parseDateFields = (v) =>
  String(v || '')
    .split(',')
    .map((f) => DATE_FIELD_MAP[f.trim()])
    .filter(Boolean);

const usersNamed = async (regex) => {
  const users = await User.find({ name: regex }).select('_id').lean();
  return users.map((u) => u._id);
};

const statusCondition = (selected) => {
  const s = selected.trim().toLowerCase();
  if (s === 'published live') return { status: ciOneOf(['published live', 'published', 'live']) };
  if (s === 'qc' || s === 'in qc') {
    return { $or: [{ status: ciOneOf(['qc', 'in qc']) }, { status: /client approval/i }] };
  }
  if (s === 'inprogress') return { status: ciOneOf(['inprogress', 'in progress']) };
  if (s.includes('client approval')) return { status: /client approval/i };
  if (s === 'waiting for response') return { status: ciOneOf(['waiting for response', 'waiting for responce']) };
  if (s === 'not started') {
    // A task with no status is treated as "Not started"
    return { $or: [{ status: ciExact('not started') }, { status: null }, { status: '' }] };
  }
  return { status: ciExact(s) };
};

const contentTypeCondition = (selected) => {
  const s = selected.trim().toLowerCase();
  if (s === 'reels' || s === 'reel') return { contentType: ciOneOf(['reels', 'reel']) };
  if (s === 'stories' || s === 'story') return { contentType: ciOneOf(['stories', 'story']) };
  if (s === 'post') return { contentType: ciExact('post') };
  if (s === 'others task' || s === 'other' || s === 'others') {
    return {
      $or: [
        { contentType: ciOneOf(['others task', 'other', 'others']) },
        { contentType: null },
        { contentType: '' },
      ],
    };
  }
  return { contentType: ciExact(s) };
};

const categoryCondition = (selected) => {
  const s = selected.trim().toLowerCase();
  if (s === 'content calendar' || s === 'content calendor') {
    return {
      $or: [
        { category: ciOneOf(['content calendar', 'content calendor', 'content']) },
        { commitment: true },
      ],
    };
  }
  return { category: ciExact(s) };
};

const anyFieldInRange = (fields, from, to) => {
  const range = {};
  if (from) range.$gte = from;
  if (to) range.$lte = to;
  return { $or: fields.map((f) => ({ [f]: range })) };
};

// What this user may see at all: own tasks for regular users, Chennai clients for the
// Social Media Head, never inactive clients, and the Admin / Op Manager branch tab.
const buildBaseClauses = async (req, q) => {
  const { isPrivileged, isAdminOrOpManager } = getRoleFlags(req.user);
  const needChennai = isSocialMediaHeadUser(req.user);
  const [{ chennaiClients, inactiveClients }, branchCondition] = await Promise.all([
    loadClientScopes({ needChennai, needInactive: true }),
    isAdminOrOpManager && !needChennai ? buildBranchCondition(q.branch) : null,
  ]);

  const baseClauses = [];
  if (!isPrivileged && req.user) {
    // Regular users see only tasks they created (same rule the page applied client-side)
    const me = ciExact(req.user.name || '');
    baseClauses.push({
      $or: [
        { createdBy: req.user._id },
        ...(req.user.name ? [{ createdByName: me }] : []),
        ...(req.user.name
          ? [{ createdBy: null, createdByName: { $in: [null, ''] }, assigneeName: me }]
          : []),
      ],
    });
  }
  if (needChennai) baseClauses.push(buildChennaiCondition(chennaiClients));
  const inactiveExclusion = buildInactiveExclusion(inactiveClients);
  if (inactiveExclusion) baseClauses.push(inactiveExclusion);
  if (branchCondition) baseClauses.push(branchCondition);
  return baseClauses;
};

// @desc    Filtered, sorted and paginated SM tasks
// @route   GET /api/socialmedia-task-calendar/paged
// @access  Private
exports.getSocialmediaTasksPaged = async (req, res) => {
  try {
    const q = req.query;
    const { isPrivileged } = getRoleFlags(req.user);
    const exportAll = q.all === '1' || q.all === 'true';
    const limit = exportAll
      ? MAX_EXPORT
      : Math.min(MAX_LIMIT, Math.max(1, parseInt(q.limit, 10) || DEFAULT_LIMIT));
    const page = exportAll ? 1 : Math.max(1, parseInt(q.page, 10) || 1);

    // ── Base scope: what this user may see at all (also used for the "total" count) ──
    const baseClauses = await buildBaseClauses(req, q);

    // ── Filters ──
    const filterClauses = [];

    if (q.search && q.search.trim()) {
      const rx = new RegExp(escapeRegex(q.search.trim()), 'i');
      const creatorIds = await usersNamed(rx);
      filterClauses.push({
        $or: [
          { taskTitle: rx },
          { clientName: rx },
          { createdByName: rx },
          { assigneeName: rx },
          { taskCode: rx },
          ...(creatorIds.length ? [{ createdBy: { $in: creatorIds } }] : []),
        ],
      });
    }

    if (!isAll(q.clientName)) filterClauses.push({ clientName: q.clientName });

    if (isPrivileged && !isAll(q.createdBy)) {
      const target = ciExact(q.createdBy);
      const ids = await usersNamed(target);
      filterClauses.push({
        $or: [
          ...(ids.length ? [{ createdBy: { $in: ids } }] : []),
          { createdByName: target },
          { assigneeName: target },
        ],
      });
    }

    if (!isAll(q.category)) filterClauses.push(categoryCondition(q.category));
    if (!isAll(q.contentType)) filterClauses.push(contentTypeCondition(q.contentType));
    if (!isAll(q.status)) filterClauses.push(statusCondition(q.status));
    if (!isAll(q.priority)) filterClauses.push({ priority: q.priority });

    if (q.commitment === 'Yes') filterClauses.push({ commitment: true });
    else if (q.commitment === 'No') filterClauses.push({ commitment: { $ne: true } });

    const now = new Date();
    if (q.atRisk === 'true' || q.atRisk === '1') {
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      filterClauses.push({
        commitment: true,
        status: { $not: ciOneOf(AT_RISK_DONE) },
        $or: [
          { publishDate: { $gte: now, $lte: in24h } },
          { publishDate: null, dueDate: { $gte: now, $lte: in24h } },
        ],
      });
    }

    // Date preset / custom range: the client sends local-time boundaries as ISO strings
    const dateFields = parseDateFields(q.dateFields);
    if (dateFields.length) {
      if (q.overdue === 'true' || q.overdue === '1') {
        filterClauses.push({ status: { $not: ciOneOf(AT_RISK_DONE) } });
        filterClauses.push(anyFieldInRange(dateFields, null, new Date(now.getTime() - 1)));
      } else {
        const from = parseDate(q.dateFrom);
        const to = parseDate(q.dateTo);
        if (from || to) filterClauses.push(anyFieldInRange(dateFields, from, to));
      }
    }

    const match = [...baseClauses, ...filterClauses];
    const pipeline = [{ $match: match.length ? { $and: match } : {} }];

    // Month selector (Commitment tab): month of the task's primary date
    const monthFrom = parseDate(q.monthFrom);
    const monthTo = parseDate(q.monthTo);
    if (monthFrom && monthTo) {
      const primary =
        q.monthField === 'publish'
          ? { $ifNull: ['$publishDate', { $ifNull: ['$dueDate', '$createdAt'] }] }
          : { $ifNull: ['$dueDate', { $ifNull: ['$publishDate', '$createdAt'] }] };
      pipeline.push(
        { $addFields: { _monthDate: primary } },
        { $match: { _monthDate: { $gte: monthFrom, $lte: monthTo } } }
      );
    }

    // Sorting: SME tab → newest first; Commitment tab → date ascending, undated last
    let sortStage;
    if (q.sort === 'created_desc') {
      sortStage = { createdAt: -1, _id: -1 };
    } else {
      const sortDate =
        q.sort === 'due_asc'
          ? { $ifNull: ['$dueDate', { $ifNull: ['$publishDate', '$createdAt'] }] }
          : { $ifNull: ['$publishDate', { $ifNull: ['$dueDate', '$createdAt'] }] };
      pipeline.push({
        $addFields: {
          _sortDate: sortDate,
          _sortMissing: { $cond: [{ $eq: [{ $ifNull: [sortDate, null] }, null] }, 1, 0] },
        },
      });
      sortStage = { _sortMissing: 1, _sortDate: 1, createdAt: 1, _id: 1 };
    }

    pipeline.push({
      $facet: {
        data: [
          { $sort: sortStage },
          { $skip: (page - 1) * limit },
          { $limit: limit },
          { $project: { _sortDate: 0, _sortMissing: 0, _monthDate: 0 } },
        ],
        total: [{ $count: 'n' }],
        commitments: [{ $match: { commitment: true } }, { $count: 'n' }],
      },
    });

    const [[facet], totalAll] = await Promise.all([
      SocialmediaTaskCalendor.aggregate(pipeline).allowDiskUse(true),
      SocialmediaTaskCalendor.countDocuments(baseClauses.length ? { $and: baseClauses } : {}),
    ]);

    const rows = await SocialmediaTaskCalendor.populate(facet.data, [
      { path: 'client', select: 'companyName color icon industry posts reels story status branch' },
      {
        path: 'assignee',
        select: 'name email role profile',
        populate: { path: 'profile', select: 'profileImage' },
      },
      {
        path: 'createdBy',
        select: 'name email role profile',
        populate: { path: 'profile', select: 'profileImage' },
      },
    ]);

    const nowMs = now.getTime();
    const data = rows.map((t) => {
      let isAtRisk = false;
      const s = (t.status || '').trim().toLowerCase();
      if (t.commitment && !AT_RISK_DONE.includes(s)) {
        const target = t.publishDate || t.dueDate;
        if (target) {
          const diffHours = (new Date(target).getTime() - nowMs) / 3600000;
          isAtRisk = diffHours >= 0 && diffHours <= 24;
        }
      }
      return { ...t, isAtRisk };
    });

    const total = facet.total[0]?.n || 0;
    res.status(200).json({
      success: true,
      data,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      filteredCommitments: facet.commitments[0]?.n || 0,
      totalAll,
    });
  } catch (error) {
    console.error('[SocialmediaTaskCalendor] getSocialmediaTasksPaged error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

