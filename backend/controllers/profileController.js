const User = require("../models/User");
const Profile = require("../models/Profile");
const { uploadMedia, replaceMedia, deleteMedia } = require("../config/s3");


// CREATE PROFILE
exports.createProfile = async (req, res) => {

  try {

    const {
      bio,
      phone,
    } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let imageData = {};

    if (req.file) {

      const result = await uploadMedia(req.file, "profiles");

      imageData = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    }

    const profile = await Profile.create({
      user: req.user._id,
      bio,
      phone,
      profileImage: imageData,
    });

    await User.findByIdAndUpdate(req.user._id, {
      profile: profile._id,
    });
    try {
      const io = req.app.get('io');
      if (io) io.emit('user_profile_updated', { userId: req.user._id, profile });
    } catch (e) {
      console.error('Socket emit error:', e);
    }

    res.status(201).json({
      success: true,
      profile,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// GET PROFILE
exports.getProfile = async (req, res) => {

  try {

    const user = await User.findById(req.user._id)
      .populate("profile");

    res.status(200).json({
      success: true,
      profile: user.profile,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};




// UPDATE PROFILE
exports.updateProfile = async (req, res) => {
  try {
    const { bio, phone } = req.body;

    const user = await User.findById(req.user._id).populate("profile");

    if (!user.profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    const profile = user.profile;

    if (bio !== undefined) profile.bio = bio;
    if (phone !== undefined) profile.phone = phone;

    // IMAGE UPDATE
    if (req.file) {
      // UPLOAD NEW IMAGE TO S3, THEN DELETE OLD ONE (S3 or old Cloudinary)
      try {
        const result = await replaceMedia(profile.profileImage, req.file, "profiles");

        profile.profileImage = {
          public_id: result.public_id,
          url: result.secure_url,
        };
      } catch (uploadErr) {
        console.error("S3 UPLOAD FAILED:", uploadErr);
        return res.status(400).json({
          success: false,
          message: "Image upload failed: " + (uploadErr.message || JSON.stringify(uploadErr)),
        });
      }
    }

    await profile.save();
    try {
      const io = req.app.get('io');
      if (io) io.emit('user_profile_updated', { userId: req.user._id, profile });
    } catch (e) {
      console.error('Socket emit error:', e);
    }

    res.status(200).json({
      success: true,
      profile,
    });

  } catch (error) {
    require('fs').writeFileSync('error.txt', error.stack || error.message);
    console.error("UPDATE PROFILE ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};




// DELETE PROFILE IMAGE
exports.deleteProfileImage = async (req, res) => {

  try {

    const user = await User.findById(req.user._id);

    const profile = user && user.profile
      ? await Profile.findById(user.profile)
      : null;

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    if (profile.profileImage && (profile.profileImage.public_id || profile.profileImage.url)) {

      // Removes from S3 (or old Cloudinary); never blocks the profile update
      await deleteMedia(profile.profileImage);

      profile.profileImage = {
        public_id: "",
        url: "",
      };

      await profile.save();
      try {
        const io = req.app.get('io');
        if (io) io.emit('user_profile_updated', { userId: req.user._id, profile });
      } catch (e) {
        console.error('Socket emit error:', e);
      }
    }

    res.status(200).json({
      success: true,
      message: "Profile image deleted",
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};