// Meta Lead Ads webhook.
// Mounted BEFORE express.json() in server.js with a raw body parser so the
// X-Hub-Signature-256 HMAC can be verified against the exact bytes Meta sent.
//
// Meta setup (developers.facebook.com → your app → Webhooks → Page):
//   Callback URL : https://<your-backend-domain>/api/webhooks/meta
//   Verify token : value of META_VERIFY_TOKEN
//   Subscribe to : leadgen

const express = require('express');
const crypto = require('crypto');
const { fetchAndSaveLead, notifyAdminsNewLead } = require('../utils/metaLeads');

const router = express.Router();

// Last time a webhook event arrived — shown on the Leads page as a health indicator
let lastWebhookAt = null;
const getLastWebhookAt = () => lastWebhookAt;

// 1. Verification handshake (Meta calls this once when you save the webhook)
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token && token === process.env.META_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

const isValidSignature = (req) => {
  const secret = process.env.META_APP_SECRET;
  if (!secret) {
    console.warn('[MetaWebhook] META_APP_SECRET not set — rejecting webhook (cannot verify signature)');
    return false;
  }
  const header = req.get('x-hub-signature-256') || '';
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(req.body).digest('hex');
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

// 2. Lead events
router.post('/', express.raw({ type: '*/*', limit: '1mb' }), async (req, res) => {
  if (!Buffer.isBuffer(req.body) || !isValidSignature(req)) {
    return res.sendStatus(401);
  }

  // Acknowledge immediately — Meta retries if it doesn't get a 200 quickly
  res.sendStatus(200);
  lastWebhookAt = new Date();

  let payload;
  try {
    payload = JSON.parse(req.body.toString('utf8'));
  } catch {
    return;
  }
  if (payload.object !== 'page') return;

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== 'leadgen') continue;
      const leadgenId = change.value?.leadgen_id;
      if (!leadgenId) continue;
      try {
        const { lead, isNew } = await fetchAndSaveLead(leadgenId, { pageId: change.value?.page_id || entry.id });
        if (isNew) {
          console.log(`[MetaWebhook] New lead saved: ${lead.fullName || leadgenId}`);
          notifyAdminsNewLead(req.app, lead);
        }
      } catch (err) {
        // Not fatal: "Sync from Meta" on the Leads page will pick it up later
        console.error(`[MetaWebhook] Failed to fetch lead ${leadgenId}:`, err.message);
      }
    }
  }
});

module.exports = router;
module.exports.getLastWebhookAt = getLastWebhookAt;
