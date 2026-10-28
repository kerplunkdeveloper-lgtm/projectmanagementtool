const Goal = require('../models/Goal');

// @desc    Get all goals for logged in user
// @route   GET /api/goals
// @access  Private
exports.getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: goals.length,
      data: goals,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create new goal
// @route   POST /api/goals
// @access  Private
exports.createGoal = async (req, res) => {
  try {
    req.body.user = req.user.id;
    if (!req.body.createdAt) {
      req.body.createdAt = new Date();
    }

    const goal = await Goal.create(req.body);

    res.status(201).json({
      success: true,
      data: goal,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update goal
// @route   PUT /api/goals/:id
// @access  Private
exports.updateGoal = async (req, res) => {
  try {
    if (req.body.completed !== undefined) {
      req.body.completedAt = req.body.completed ? new Date() : null;
    }

    const filter = { _id: req.params.id };
    if (req.user.role !== 'admin') {
      filter.user = req.user.id;
    }

    const goal = await Goal.findOneAndUpdate(filter, req.body, {
      returnDocument: 'after',
      runValidators: true,
    });

    if (!goal) {
      const exists = await Goal.findById(req.params.id);
      if (!exists) {
        return res.status(404).json({
          success: false,
          message: 'Goal not found',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this goal',
      });
    }

    res.status(200).json({
      success: true,
      data: goal,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete goal
// @route   DELETE /api/goals/:id
// @access  Private
exports.deleteGoal = async (req, res) => {
  try {
    const filter = { _id: req.params.id };
    if (req.user.role !== 'admin') {
      filter.user = req.user.id;
    }

    const goal = await Goal.findOneAndDelete(filter);

    if (!goal) {
      const exists = await Goal.findById(req.params.id);
      if (!exists) {
        return res.status(404).json({
          success: false,
          message: 'Goal not found',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this goal',
      });
    }

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
