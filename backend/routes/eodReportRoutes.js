const express = require('express');
const {
  createEodReport,
  getEodReports,
  getEodReport,
  updateEodReport,
} = require('../controllers/eodReportController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .get(protect, getEodReports)
  .post(protect, authorize('team'), createEodReport);

router
  .route('/:id')
  .get(protect, getEodReport)
  .put(protect, authorize('team'), updateEodReport);

module.exports = router;
