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
  cleanDuplicateTasks,
  getSocialmediaMetadata,
} = require('../controllers/socialmediaTaskCalendorController');

const { protect } = require('../middleware/auth');

// Protect all routes with JWT auth
router.use(protect);

router.get('/meta', getSocialmediaMetadata);
router.post('/clean-duplicates', cleanDuplicateTasks);

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
