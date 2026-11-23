// Meta (Facebook / Instagram) Lead Ads helpers: Graph API calls, field mapping, upsert.
//
// Required env:
//   META_PAGE_ACCESS_TOKEN  long-lived Page access token with `leads_retrieval`,
//                           `pages_manage_metadata`, `pages_show_list`, `pages_read_engagement`
//   META_PAGE_ID            the Facebook Page that owns the lead forms (used by "Sync from Meta")
//   META_APP_SECRET         Meta app secret (verifies webhook signatures)
//   META_VERIFY_TOKEN       any random string; must match the one entered in the Meta webhook setup
// Optional:
//   META_GRAPH_VERSION      Graph API version, e.g. "v23.0"

const Lead = require('../models/Lead');
const User = require('../models/User');

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v23.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

const LEAD_FIELDS = [
  'id',
  'created_time',
  'field_data',
  'ad_id',
  'ad_name',
  'adset_id',
  'adset_name',
  'campaign_id',
  'campaign_name',
  'form_id',
  'platform',
  'is_organic',
].join(',');

const isMetaConfigured = () => Boolean(process.env.META_PAGE_ACCESS_TOKEN);

const graphGet = async (pathOrUrl, params = {}) => {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!token) throw new Error('META_PAGE_ACCESS_TOKEN is not configured on the server');

  const url = pathOrUrl.startsWith('http') ? new URL(pathOrUrl) : new URL(`${GRAPH_BASE}/${pathOrUrl}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  if (!url.searchParams.has('access_token')) url.searchParams.set('access_token', token);

  const res = await fetch(url);
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    const msg = json?.error?.message || `Graph API error ${res.status}`;
    throw new Error(msg);
  }
  return json;
};

// Form names rarely change — cache them for the life of the process
const formNameCache = new Map();
const getFormName = async (formId) => {
  if (!formId) return '';
  if (formNameCache.has(formId)) return formNameCache.get(formId);
  try {
    const json = await graphGet(formId, { fields: 'name' });
    formNameCache.set(formId, json.name || '');
    return json.name || '';
  } catch {
    return '';
  }
};

const pick = (map, keys) => {
  for (const k of keys) {
    if (map[k]) return map[k];
  }
  return '';
};

// Turn Meta's field_data ([{ name, values: [] }]) into our flat lead fields
const mapFieldData = (fieldData = []) => {
  const flat = [];
  const byName = {};
  fieldData.forEach((f) => {
    const name = String(f.name || '').trim();
    const value = Array.isArray(f.values) ? f.values.join(', ') : String(f.values ?? f.value ?? '');
    if (!name) return;
    flat.push({ name, value });
    byName[name.toLowerCase()] = value;
  });

  let fullName = pick(byName, ['full_name', 'full name', 'name']);
  if (!fullName) {
    fullName = [pick(byName, ['first_name', 'first name']), pick(byName, ['last_name', 'last name'])]
      .filter(Boolean)
      .join(' ');
  }

  return {
    fieldData: flat,
    fullName,
    email: pick(byName, ['email', 'email_address', 'work_email']),
    phone: pick(byName, ['phone_number', 'phone', 'mobile', 'mobile_number', 'whatsapp_number']),
    city: pick(byName, ['city', 'location', 'your_city']),
  };
};

// Build a Lead document payload from a Graph API lead object
const buildLeadDoc = async (raw, { source, pageId } = {}) => {
  const mapped = mapFieldData(raw.field_data);
  return {
    leadgenId: String(raw.id),
    ...mapped,
    pageId: pageId || '',
    formId: raw.form_id || '',
    formName: raw.form_name || (await getFormName(raw.form_id)),
    adId: raw.ad_id || '',
    adName: raw.ad_name || '',
    adsetId: raw.adset_id || '',
    adsetName: raw.adset_name || '',
    campaignId: raw.campaign_id || '',
    campaignName: raw.campaign_name || '',
    platform: raw.platform || '',
    isOrganic: Boolean(raw.is_organic),
    source: source || 'meta_webhook',
    submittedAt: raw.created_time ? new Date(raw.created_time) : new Date(),
  };
};

// Insert the lead if new; if it already exists only refresh Meta-owned fields
// (never overwrite CRM fields like status / notes / assignedTo).
// Returns { lead, isNew }.
const upsertLead = async (doc) => {
  const { leadgenId, source, ...metaFields } = doc;
  const res = await Lead.findOneAndUpdate(
    { leadgenId },
    { $set: metaFields, $setOnInsert: { leadgenId, source } },
    { upsert: true, returnDocument: 'after', includeResultMetadata: true }
  );
  const isNew = !res.lastErrorObject?.updatedExisting;
  return { lead: res.value, isNew };
};

// Fetch a single lead by its leadgen_id (used by the webhook)
const fetchAndSaveLead = async (leadgenId, { pageId } = {}) => {
  const raw = await graphGet(String(leadgenId), { fields: LEAD_FIELDS });
  const doc = await buildLeadDoc(raw, { source: 'meta_webhook', pageId });
  return upsertLead(doc);
};

// Pull all leads from every lead form on the page (backfill / recover missed webhooks).
// Meta only keeps leads downloadable for ~90 days.
const syncLeadsFromMeta = async ({ days = 90 } = {}) => {
  const pageId = process.env.META_PAGE_ID;
  if (!pageId) throw new Error('META_PAGE_ID is not configured on the server');

  const sinceUnix = Math.floor((Date.now() - days * 24 * 60 * 60 * 1000) / 1000);
  const filtering = JSON.stringify([{ field: 'time_created', operator: 'GREATER_THAN', value: sinceUnix }]);

  let created = 0;
  let updated = 0;
  let forms = 0;
  const errors = [];

  let formsPage = await graphGet(`${pageId}/leadgen_forms`, { fields: 'id,name,status', limit: '100' });
  while (formsPage) {
    for (const form of formsPage.data || []) {
      forms++;
      formNameCache.set(form.id, form.name || '');
      try {
        let leadsPage = await graphGet(`${form.id}/leads`, { fields: LEAD_FIELDS, limit: '100', filtering });
        while (leadsPage) {
          for (const raw of leadsPage.data || []) {
            const doc = await buildLeadDoc({ ...raw, form_id: raw.form_id || form.id, form_name: form.name }, { source: 'meta_sync', pageId });
            const { isNew } = await upsertLead(doc);
            if (isNew) created++;
            else updated++;
          }
          leadsPage = leadsPage.paging?.next ? await graphGet(leadsPage.paging.next) : null;
        }
      } catch (err) {
        errors.push(`${form.name || form.id}: ${err.message}`);
      }
    }
    formsPage = formsPage.paging?.next ? await graphGet(formsPage.paging.next) : null;
  }

  return { forms, created, updated, errors };
};

// Real-time push to admins who have the app open
const notifyAdminsNewLead = async (app, lead) => {
  try {
    const io = app?.get('io');
    if (!io || !lead) return;
    const admins = await User.find({ role: 'admin' }).select('_id').lean();
    const payload = {
      _id: lead._id,
      fullName: lead.fullName,
      phone: lead.phone,
      formName: lead.formName,
      campaignName: lead.campaignName,
      submittedAt: lead.submittedAt,
    };
    admins.forEach((a) => io.to(a._id.toString()).emit('lead:new', payload));
  } catch (err) {
    console.error('[MetaLeads] notifyAdminsNewLead error:', err.message);
  }
};

module.exports = {
  isMetaConfigured,
  mapFieldData,
  upsertLead,
  fetchAndSaveLead,
  syncLeadsFromMeta,
  notifyAdminsNewLead,
  GRAPH_VERSION,
};
