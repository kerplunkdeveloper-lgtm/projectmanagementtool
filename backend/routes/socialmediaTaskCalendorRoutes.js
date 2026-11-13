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
  cleanDuplicateTasks,
  getSocialmediaMetadata,
  bulkImportSocialmediaTasks,
} = require('../controllers/socialmediaTaskCalendorController');

const {
  getDailySchedule,
  toggleSlotCompletion,
  toggleSubtaskCompletion,
  getExecutivesSummary,
} = require('../controllers/smDailyScheduleController');

const { protect } = require('../middleware/auth');

// Protect all routes with JWT auth
router.use(protect);

// Daily Work Schedule Routes
router.get('/daily-schedule', getDailySchedule);
router.patch('/daily-schedule/toggle-slot', toggleSlotCompletion);
router.patch('/daily-schedule/toggle-subtask', toggleSubtaskCompletion);
router.get('/daily-schedule/executives-summary', getExecutivesSummary);

router.get('/meta', getSocialmediaMetadata);
router.post('/clean-duplicates', cleanDuplicateTasks);
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
