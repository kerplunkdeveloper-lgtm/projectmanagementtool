const Project = require('../models/Project');
const User = require('../models/User');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res, next) => {
  try {
    let query;

    // If not admin, only show projects assigned to user or created by user
    if (req.user.role !== 'admin') {
      query = {
        $or: [
          { assignedTo: req.user._id },
          { createdBy: req.user._id },
        ],
      };
    }

    const projects = await Project.find(query)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Check if user has access to this project
    if (
      req.user.role !== 'admin' &&
      !project.assignedTo.some(user => user._id.toString() === req.user._id.toString()) &&
      project.createdBy._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this project',
      });
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private/Admin or Quality Lead
exports.createProject = async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.createdBy = req.user._id;

    const project = await Project.create(req.body);

    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private/Admin or Creator
exports.updateProject = async (req, res, next) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Make sure user is project creator or admin
    if (
      project.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this project',
      });
    }

    project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private/Admin or Creator
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Make sure user is project creator or admin
    if (
      project.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this project',
      });
    }

    await project.remove();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Assign project to users
// @route   PUT /api/projects/:id/assign
// @access  Private/Admin or Quality Lead
exports.assignProject = async (req, res, next) => {
  try {
    const { userIds } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Check if users exist and have team role
    const users = await User.find({ _id: { $in: userIds }, role: 'team' });

    if (users.length !== userIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some users not found or not team members',
      });
    }

    project.assignedTo = userIds;
    await project.save();

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};