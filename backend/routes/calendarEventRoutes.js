const express = require('express');
const router = express.Router();

const {
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} = require('../controllers/calendarEventController');

const { protect, authorize } = require('../middleware/auth');

// GET all calendar events
router.get(
  '/',
  protect,
  authorize('admin', 'operationmanager', 'team'),
  getCalendarEvents
);

// CREATE calendar event
router.post(
  '/',
  protect,
  authorize('admin', 'operationmanager', 'team'),
  createCalendarEvent
);

// UPDATE calendar event
router.put(
  '/:id',
  protect,
  authorize('admin', 'operationmanager', 'team'),
  updateCalendarEvent
);

// DELETE calendar event
router.delete(
  '/:id',
  protect,
  authorize('admin', 'operationmanager', 'team'),
  deleteCalendarEvent
);

module.exports = router;
