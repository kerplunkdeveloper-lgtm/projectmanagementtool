const Profile = require('../models/Profile');
const User = require('../models/User');

// @desc    Get current user's profile
// @route   GET /api/profile/me
// @access  Private
exports.getMyProfile = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id }).populate('user', 'name email role');

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found',
      });
    }

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Update profile
// @route   PUT /api/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      bio: req.body.bio,
      skills: req.body.skills,
      experience: req.body.experience,
      department: req.body.department,
      phone: req.body.phone,
      address: req.body.address,
    };

    const profile = await Profile.findOneAndUpdate(
      { user: req.user._id },
      fieldsToUpdate,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found',
      });
    }

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Delete profile
// @route   DELETE /api/profile
// @access  Private
exports.deleteProfile = async (req, res, next) => {
  try {
    const profile = await Profile.findOneAndDelete({ user: req.user._id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found',
      });
    }

    // Also remove profile reference from user
    await User.findByIdAndUpdate(req.user._id, { profile: null });

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

// @desc    Get all profiles
// @route   GET /api/profile
// @access  Private/Admin
exports.getProfiles = async (req, res, next) => {
  try {
    const profiles = await Profile.find().populate('user', 'name email role');

    res.status(200).json({
      success: true,
      count: profiles.length,
      data: profiles,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Get single profile
// @route   GET /api/profile/:id
// @access  Private/Admin
exports.getProfile = async (req, res, next) => {
  try {
    const profile = await Profile.findById(req.params.id).populate('user', 'name email role');

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found',
      });
    }

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};