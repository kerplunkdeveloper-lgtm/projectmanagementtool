const mongoose = require('mongoose');

const SM_HEAD_BRANCH = 'chennai';

// Same rule as the Social Media Head check used for SM tasks (Chennai-only access)
const isSocialMediaHeadUser = (user) => {
  if (!user) return false;
  const role = (user.role || '').toLowerCase().replace(/[\s_]/g, '');
  const dept = (user.department || '').toLowerCase().trim();
  if (role.includes('executive') || dept.includes('executive')) return false;
  return (
    role === 'socialmediamanager' ||
    role === 'socialmediahead' ||
    dept.includes('social media head') ||
    dept.includes('social media manager') ||
    dept.includes('social media')
  );
};

const normBranch = (b) => (b || '').toString().trim().toLowerCase();

/**
 * Loads branch lookups for all clients: id -> branch, lowercase name -> branch.
 * Clients without a branch fall back to Pondicherry (schema default).
 */
const loadClientBranchMaps = async () => {
  const Client = mongoose.model('Client');
  const clients = await Client.find({}).select('_id companyName branch').lean();
  const idMap = new Map();
  const nameMap = new Map();
  clients.forEach((c) => {
    const b = normBranch(c.branch) || 'pondicherry';
    idMap.set(String(c._id), b);
    if (c.companyName) nameMap.set(c.companyName.trim().toLowerCase(), b);
  });
  return { idMap, nameMap };
};

const refId = (v) => {
  if (!v) return null;
  if (typeof v === 'object' && v._id) return String(v._id);
  return String(v);
};

/**
 * Filters a list of (lean) notifications for a Social Media Head:
 * notifications linked to a client keep only Chennai-branch clients.
 * Notifications not tied to any client (chat, HR, general) are kept as-is.
 */
const filterNotificationsForSmHead = async (notifications) => {
  if (!notifications || notifications.length === 0) return notifications;
  const { idMap, nameMap } = await loadClientBranchMaps();

  // Resolve SM task -> client for notifications that only reference smTaskId
  const smTaskIds = notifications
    .filter((n) => n.smTaskId && !n.client && !n.clientName)
    .map((n) => refId(n.smTaskId));
  const smTaskClient = new Map();
  if (smTaskIds.length > 0) {
    const SmTask = mongoose.model('SocialmediaTaskCalendor');
    const tasks = await SmTask.find({ _id: { $in: smTaskIds } }).select('client clientName').lean();
    tasks.forEach((t) => smTaskClient.set(String(t._id), t));
  }

  const branchOf = (n) => {
    const ids = [
      refId(n.client),
      refId(n.project && n.project.client),
      refId(n.task && n.task.client),
      refId(n.task && n.task.project && n.task.project.client),
    ].filter(Boolean);
    for (const id of ids) {
      if (idMap.has(id)) return idMap.get(id);
    }
    const names = [
      n.clientName,
      n.client && n.client.companyName,
      n.project && n.project.client && n.project.client.companyName,
      n.task && n.task.project && n.task.project.client && n.task.project.client.companyName,
    ].filter(Boolean);
    for (const name of names) {
      const b = nameMap.get(name.trim().toLowerCase());
      if (b) return b;
    }
    if (n.smTaskId) {
      const t = smTaskClient.get(refId(n.smTaskId));
      if (t) {
        const tid = refId(t.client);
        if (tid && idMap.has(tid)) return idMap.get(tid);
        const tb = t.clientName && nameMap.get(t.clientName.trim().toLowerCase());
        if (tb) return tb;
      }
    }
    return null; // not client-linked
  };

  return notifications.filter((n) => {
    const b = branchOf(n);
    return b === null || b === SM_HEAD_BRANCH;
  });
};

/**
 * True when the given client (id or name) belongs to the Chennai branch.
 */
const isChennaiClient = async (clientId, clientName) => {
  const Client = mongoose.model('Client');
  let client = null;
  if (clientId && mongoose.Types.ObjectId.isValid(String(clientId))) {
    client = await Client.findById(clientId).select('branch').lean();
  }
  if (!client && clientName) {
    const escaped = clientName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    client = await Client.findOne({ companyName: new RegExp(`^${escaped}$`, 'i') }).select('branch').lean();
  }
  if (!client) return false;
  return (normBranch(client.branch) || 'pondicherry') === SM_HEAD_BRANCH;
};

module.exports = {
  isSocialMediaHeadUser,
  filterNotificationsForSmHead,
  isChennaiClient,
};
