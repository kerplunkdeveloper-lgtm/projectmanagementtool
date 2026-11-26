// Shared query-building helpers for Social Media task endpoints
// (calendar list, stats and the paginated SM Tasks table).
const Client = require('../models/Client');

// Escape user/DB text before putting it in a RegExp (client names like "A+B (Pvt)" would
// otherwise break the pattern or match the wrong clients).
const escapeRegex = (str = '') => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Case-insensitive, whitespace-tolerant exact match (mirrors the frontend's trim().toLowerCase() compare)
const ciExact = (str) => new RegExp(`^\\s*${escapeRegex(String(str).trim())}\\s*$`, 'i');
const ciOneOf = (values) =>
  new RegExp(`^\\s*(${values.map((v) => escapeRegex(v)).join('|')})\\s*$`, 'i');

// Role flags — same rules the frontend uses for "can see everyone's tasks"
const getRoleFlags = (user) => {
  const userRole = (user?.role || '').toLowerCase().replace(/[\s_]/g, '');
  const deptLower = (user?.department || '').toLowerCase();
  const isSocialMediaManager =
    userRole === 'socialmediamanager' ||
    userRole === 'socialmediahead' ||
    deptLower.includes('social media head');
  const isAdminOrOpManager = userRole === 'admin' || userRole === 'operationmanager';
  return {
    userRole,
    isAdminOrOpManager,
    isPrivileged: isAdminOrOpManager || isSocialMediaManager,
  };
};

// Load the client scopes a task query needs, in parallel.
const loadClientScopes = async ({ needChennai, needInactive }) => {
  const [chennaiClients, inactiveClients] = await Promise.all([
    needChennai
      ? Client.find({ branch: /^chennai$/i, status: { $nin: ['Inactive', 'inactive'] } }).select('_id companyName').lean()
      : null,
    needInactive
      ? Client.find({ status: { $regex: /^inactive$/i } }).select('_id companyName').lean()
      : [],
  ]);
  return { chennaiClients, inactiveClients };
};

const buildChennaiCondition = (chennaiClients) => ({
  $or: [
    { client: { $in: chennaiClients.map((c) => c._id) } },
    {
      clientName: {
        $in: chennaiClients
          .map((c) => c.companyName)
          .filter(Boolean)
          .map((n) => new RegExp(`^${escapeRegex(n)}$`, 'i')),
      },
    },
  ],
});

const buildInactiveExclusion = (inactiveClients) => {
  if (!inactiveClients || inactiveClients.length === 0) return null;
  const names = [];
  inactiveClients.forEach((c) => {
    const n = (c.companyName || '').trim();
    if (n) names.push(ciExact(n));
  });
  return {
    client: { $nin: inactiveClients.map((c) => c._id) },
    ...(names.length ? { clientName: { $nin: names } } : {}),
  };
};

// Branch tab filter (Admin / Operation Manager). Mirrors useBranchFilter on the frontend:
// a task's branch comes from its client id, else its client name, else defaults to Pondicherry.
const buildBranchCondition = async (branch) => {
  const target = (branch || '').trim().toLowerCase();
  if (!target || target === 'all') return null;
  const clients = await Client.find({}).select('_id companyName branch').lean();
  const allIds = [];
  const allNames = [];
  const targetIds = [];
  const targetNames = [];
  clients.forEach((c) => {
    const b = (c.branch || '').trim().toLowerCase() || 'pondicherry';
    allIds.push(c._id);
    const name = (c.companyName || '').trim();
    if (name) allNames.push(ciExact(name));
    if (b === target) {
      targetIds.push(c._id);
      if (name) targetNames.push(ciExact(name));
    }
  });
  const unknownClientId = { $or: [{ client: null }, { client: { $nin: allIds } }] };
  const or = [{ client: { $in: targetIds } }];
  if (targetNames.length) {
    or.push({ $and: [unknownClientId, { clientName: { $in: targetNames } }] });
  }
  if (target === 'pondicherry') {
    // Tasks whose client can't be resolved at all fall back to Pondicherry
    or.push({ $and: [unknownClientId, { clientName: { $nin: allNames } }] });
  }
  return { $or: or };
};

module.exports = {
  escapeRegex,
  ciExact,
  ciOneOf,
  getRoleFlags,
  loadClientScopes,
  buildChennaiCondition,
  buildInactiveExclusion,
  buildBranchCondition,
};
