const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getLeads,
  getLeadStats,
  getMetaStatus,
  getLead,
  updateLead,
  deleteLead,
  syncFromMeta,
  importLeads,
  exportLeads,
} = require('../controllers/leadController');

const router = express.Router();

// CRM Leads are admin-only
const adminOnly = (req, res, next) => {
  if ((req.user?.role || '').toLowerCase() === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Only admins can access leads' });
};

router.use(protect, adminOnly);

router.get('/', getLeads);
router.get('/stats', getLeadStats);
router.get('/meta-status', getMetaStatus);
router.get('/export', exportLeads);
router.post('/sync', syncFromMeta);
router.post('/import', importLeads);

router.route('/:id').get(getLead).patch(updateLead).delete(deleteLead);

module.exports = router;
