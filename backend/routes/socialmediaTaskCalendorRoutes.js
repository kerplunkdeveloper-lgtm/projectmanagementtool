const express = require('express');
const router = express.Router();

const {
  getSocialmediaTasks,
  getSocialmediaStats,
  getSocialmediaTaskById,
  createSocialmediaTask,
  updateSocialmediaTask,
  rescheduleSocialmediaTask,
  deleteSocialmediaTask,
  bulkDeleteSocialmediaTasks,
  getSocialmediaMetadata,
  bulkImportSocialmediaTasks,
} = require('../controllers/socialmediaTaskCalendorController');

const {
  getDailySchedule,
  toggleSlotCompletion,
  toggleSubtaskCompletion,
  getExecutivesSummary,
  submitDailySchedule,
  reopenDailySchedule,
} = require('../controllers/smDailyScheduleController');

const { getSocialmediaTasksPaged } = require('../controllers/socialmediaTaskPagedController');

const { protect } = require('../middleware/auth');

// Protect all routes with JWT auth
router.use(protect);

// Daily Work Schedule Routes
router.get('/daily-schedule', getDailySchedule);
router.patch('/daily-schedule/toggle-slot', toggleSlotCompletion);
router.patch('/daily-schedule/toggle-subtask', toggleSubtaskCompletion);
router.get('/daily-schedule/executives-summary', getExecutivesSummary);
router.post('/daily-schedule/submit', submitDailySchedule);
router.post('/daily-schedule/reopen', reopenDailySchedule);

router.get('/meta', getSocialmediaMetadata);
// Server-side filtered + paginated list for the SM Tasks page (must stay above /:id)
router.get('/paged', getSocialmediaTasksPaged);
router.post('/bulk-import', bulkImportSocialmediaTasks);
router.post('/bulk-delete', bulkDeleteSocialmediaTasks);

router.route('/')
  .get(getSocialmediaTasks)
  .post(createSocialmediaTask);

router.get('/stats', getSocialmediaStats);

router.patch('/:id/reschedule', rescheduleSocialmediaTask);

router.route('/:id')
  .get(getSocialmediaTaskById)
  .put(updateSocialmediaTask)
  .delete(deleteSocialmediaTask);

module.exports = router;
