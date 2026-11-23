const Lead = require('../models/Lead');
const {
  isMetaConfigured,
  syncLeadsFromMeta,
  upsertLead,
  mapFieldData,
  GRAPH_VERSION,
} = require('../utils/metaLeads');
const { getLastWebhookAt } = require('../routes/metaWebhookRoutes');

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const SORTABLE = new Set(['submittedAt', 'fullName', 'status', 'campaignName', 'formName', 'platform', 'updatedAt']);

// Shared filter builder for list + export
const buildFilter = (q) => {
  const filter = {};
  if (q.status && q.status !== 'All') filter.status = q.status;
  if (q.platform && q.platform !== 'All') filter.platform = q.platform;
  if (q.formId && q.formId !== 'All') filter.formId = q.formId;
  if (q.campaign && q.campaign !== 'All') filter.campaignName = q.campaign;
  if (q.assignedTo && q.assignedTo !== 'All') filter.assignedTo = q.assignedTo === 'unassigned' ? null : q.assignedTo;

  if (q.from || q.to) {
    filter.submittedAt = {};
    if (q.from) filter.submittedAt.$gte = new Date(q.from);
    if (q.to) {
      const end = new Date(q.to);
      end.setHours(23, 59, 59, 999);
      filter.submittedAt.$lte = end;
    }
  }

  if (q.search && q.search.trim()) {
    const rx = new RegExp(escapeRegex(q.search.trim()), 'i');
    filter.$or = [
      { fullName: rx },
      { email: rx },
      { phone: rx },
      { city: rx },
      { campaignName: rx },
      { formName: rx },
      { adName: rx },
    ];
  }
  return filter;
};

// @route GET /api/leads
exports.getLeads = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const sortBy = SORTABLE.has(req.query.sortBy) ? req.query.sortBy : 'submittedAt';
    const sortDir = req.query.sortDir === 'asc' ? 1 : -1;
    const filter = buildFilter(req.query);

    const [data, total] = await Promise.all([
      Lead.find(filter)
        .sort({ [sortBy]: sortDir, _id: sortDir })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('assignedTo', 'name email')
        .lean(),
      Lead.countDocuments(filter),
    ]);

    res.json({ success: true, data, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/leads/stats
exports.getLeadStats = async (req, res) => {
  try {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start7d = new Date(startToday.getTime() - 6 * 24 * 60 * 60 * 1000);

    const [total, today, last7, byStatus, forms, campaigns, platforms] = await Promise.all([
      Lead.countDocuments(),
      Lead.countDocuments({ submittedAt: { $gte: startToday } }),
      Lead.countDocuments({ submittedAt: { $gte: start7d } }),
      Lead.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Lead.aggregate([
        { $match: { formId: { $ne: '' } } },
        { $group: { _id: '$formId', name: { $last: '$formName' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Lead.distinct('campaignName', { campaignName: { $ne: '' } }),
      Lead.distinct('platform', { platform: { $ne: '' } }),
    ]);

    const statusCounts = Object.fromEntries(Lead.STATUSES.map((s) => [s, 0]));
    byStatus.forEach((s) => {
      if (s._id) statusCounts[s._id] = s.count;
    });

    res.json({
      success: true,
      data: {
        total,
        today,
        last7,
        statusCounts,
        statuses: Lead.STATUSES,
        forms: forms.map((f) => ({ id: f._id, name: f.name || f._id, count: f.count })),
        campaigns: campaigns.sort((a, b) => a.localeCompare(b)),
        platforms,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/leads/meta-status
exports.getMetaStatus = async (req, res) => {
  res.json({
    success: true,
    data: {
      configured: isMetaConfigured(),
      hasPageId: Boolean(process.env.META_PAGE_ID),
      hasAppSecret: Boolean(process.env.META_APP_SECRET),
      hasVerifyToken: Boolean(process.env.META_VERIFY_TOKEN),
      graphVersion: GRAPH_VERSION,
      lastWebhookAt: getLastWebhookAt(),
    },
  });
};

// @route GET /api/leads/:id
exports.getLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id).populate('assignedTo', 'name email').lean();
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route PATCH /api/leads/:id   (CRM fields only)
exports.updateLead = async (req, res) => {
  try {
    const allowed = ['status', 'notes', 'assignedTo', 'followUpDate', 'fullName', 'email', 'phone', 'city'];
    const update = {};
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) update[k] = req.body[k] === '' && (k === 'assignedTo' || k === 'followUpDate') ? null : req.body[k];
    });
    const lead = await Lead.findByIdAndUpdate(req.params.id, { $set: update }, { returnDocument: 'after', runValidators: true })
      .populate('assignedTo', 'name email')
      .lean();
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @route DELETE /api/leads/:id
exports.deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, data: req.params.id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/leads/sync   { days }
exports.syncFromMeta = async (req, res) => {
  try {
    const days = Math.min(90, Math.max(1, parseInt(req.body?.days, 10) || 90));
    const result = await syncLeadsFromMeta({ days });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @route POST /api/leads/import   { rows: [ {column: value} ] }
// Accepts rows exported from the Meta → Google Sheets integration (or any CSV with similar headers).
// Rows with a Meta lead id are deduplicated against existing leads.
const META_META_COLUMNS = new Set([
  'id', 'created_time', 'ad_id', 'ad_name', 'adset_id', 'adset_name', 'campaign_id', 'campaign_name',
  'form_id', 'form_name', 'is_organic', 'platform', 'lead_status', 'leadgen_id', 'lead_id',
]);

exports.importLeads = async (req, res) => {
  try {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    if (rows.length === 0) return res.status(400).json({ success: false, message: 'No rows to import' });
    if (rows.length > 20000) return res.status(400).json({ success: false, message: 'Too many rows (max 20,000 per import)' });

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const original of rows) {
      // normalise headers: "Full Name" → "full_name"
      const row = {};
      Object.entries(original || {}).forEach(([k, v]) => {
        const key = String(k).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
        if (key) row[key] = v == null ? '' : String(v).trim();
      });

      const questionFields = Object.entries(row)
        .filter(([k]) => !META_META_COLUMNS.has(k))
        .map(([name, value]) => ({ name, values: [value] }));
      const mapped = mapFieldData(questionFields);

      if (!mapped.fullName && !mapped.phone && !mapped.email) {
        skipped++;
        continue;
      }

      // Meta's sheet prefixes ids like "l:123..." — strip the prefix
      const rawId = (row.id || row.leadgen_id || row.lead_id || '').replace(/^[a-z]+:/i, '');
      const created_time = row.created_time ? new Date(row.created_time) : null;

      const doc = {
        ...mapped,
        formId: (row.form_id || '').replace(/^[a-z]+:/i, ''),
        formName: row.form_name || '',
        adId: (row.ad_id || '').replace(/^[a-z]+:/i, ''),
        adName: row.ad_name || '',
        adsetId: (row.adset_id || '').replace(/^[a-z]+:/i, ''),
        adsetName: row.adset_name || '',
        campaignId: (row.campaign_id || '').replace(/^[a-z]+:/i, ''),
        campaignName: row.campaign_name || '',
        platform: row.platform || '',
        isOrganic: String(row.is_organic).toLowerCase() === 'true',
        submittedAt: created_time && !isNaN(created_time.getTime()) ? created_time : new Date(),
        source: 'import',
      };

      if (rawId) {
        const { isNew } = await upsertLead({ leadgenId: rawId, ...doc });
        if (isNew) created++;
        else updated++;
      } else {
        // No Meta id: dedupe on phone/email + submitted time
        const dupe = await Lead.findOne({
          submittedAt: doc.submittedAt,
          $or: [doc.phone ? { phone: doc.phone } : null, doc.email ? { email: doc.email } : null].filter(Boolean),
        }).lean();
        if (dupe) {
          skipped++;
        } else {
          await Lead.create(doc);
          created++;
        }
      }
    }

    res.json({ success: true, data: { created, updated, skipped } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @route GET /api/leads/export  (same filters as list) → CSV
exports.exportLeads = async (req, res) => {
  try {
    const leads = await Lead.find(buildFilter(req.query))
      .sort({ submittedAt: -1 })
      .populate('assignedTo', 'name')
      .lean();

    const esc = (v) => {
      const s = v == null ? '' : String(v);
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = ['Submitted', 'Name', 'Phone', 'Email', 'City', 'Status', 'Assigned To', 'Follow Up', 'Form', 'Campaign', 'Ad Set', 'Ad', 'Platform', 'Notes', 'Other Answers'];
    const lines = [header.join(',')];
    const known = new Set(['full_name', 'first_name', 'last_name', 'email', 'phone_number', 'phone', 'city']);
    leads.forEach((l) => {
      const other = (l.fieldData || [])
        .filter((f) => !known.has(String(f.name).toLowerCase()))
        .map((f) => `${f.name}: ${f.value}`)
        .join(' | ');
      lines.push(
        [
          l.submittedAt ? new Date(l.submittedAt).toISOString() : '',
          l.fullName, l.phone, l.email, l.city, l.status, l.assignedTo?.name || '',
          l.followUpDate ? new Date(l.followUpDate).toISOString().slice(0, 10) : '',
          l.formName, l.campaignName, l.adsetName, l.adName, l.platform, l.notes, other,
        ].map(esc).join(',')
      );
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send('﻿' + lines.join('\n'));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
