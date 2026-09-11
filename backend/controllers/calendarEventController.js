const CalendarEvent = require('../models/CalendarEvent');

// @desc    Get all calendar events
// @route   GET /api/calendar-events
// @access  Private
exports.getCalendarEvents = async (req, res) => {
  try {
    let query;

    // Admin & operation manager can see all events, others only their own
    if (req.user.role === 'admin' || req.user.role === 'operationmanager') {
      query = CalendarEvent.find()
        .populate('client', 'companyName email color icon')
        .populate('createdBy', 'name role');
    } else {
      query = CalendarEvent.find({ createdBy: req.user.id })
        .populate('client', 'companyName email color icon')
        .populate('createdBy', 'name role');
    }

    // Optional category filter
    if (req.query.category) {
      query = query.where('category').equals(req.query.category);
    }

    // Optional date range filter
    if (req.query.startDate && req.query.endDate) {
      query = query.where('date').gte(new Date(req.query.startDate)).lte(new Date(req.query.endDate));
    }

    const events = await query.sort({ date: 1 });

    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    console.error('[CalendarEvent] getCalendarEvents error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create new calendar event
// @route   POST /api/calendar-events
// @access  Private
exports.createCalendarEvent = async (req, res) => {
  try {
    req.body.createdBy = req.user.id;

    let event = await CalendarEvent.create(req.body);
    event = await event.populate('client', 'companyName email color icon');
    event = await event.populate('createdBy', 'name role');

    res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error('[CalendarEvent] createCalendarEvent error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update calendar event
// @route   PUT /api/calendar-events/:id
// @access  Private
exports.updateCalendarEvent = async (req, res) => {
  try {
    let event = await CalendarEvent.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Calendar event not found',
      });
    }

    // Make sure user is event owner or admin/operationmanager
    if (
      event.createdBy.toString() !== req.user.id &&
      req.user.role !== 'admin' &&
      req.user.role !== 'operationmanager'
    ) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this event',
      });
    }

    event = await CalendarEvent.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: 'after',
      runValidators: true,
    })
      .populate('client', 'companyName email color icon')
      .populate('createdBy', 'name role');

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error('[CalendarEvent] updateCalendarEvent error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete calendar event
// @route   DELETE /api/calendar-events/:id
// @access  Private
exports.deleteCalendarEvent = async (req, res) => {
  try {
    const event = await CalendarEvent.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Calendar event not found',
      });
    }

    // Make sure user is event owner or admin/operationmanager
    if (
      event.createdBy.toString() !== req.user.id &&
      req.user.role !== 'admin' &&
      req.user.role !== 'operationmanager'
    ) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this event',
      });
    }

    await event.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    console.error('[CalendarEvent] deleteCalendarEvent error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
