const User = require("../models/User");
const Profile = require("../models/Profile");
const cloudinary = require("../config/cloudinary");


// CREATE PROFILE
exports.createProfile = async (req, res) => {

  try {

    const {
      bio,
      phone,
      address,
    } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let imageData = {};

    if (req.file) {

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "profiles",
      });

      imageData = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    }

    const profile = await Profile.create({
      user: req.user.id,
      bio,
      phone,
      address,
      profileImage: imageData,
    });

    await User.findByIdAndUpdate(req.user.id, {
      profile: profile._id,
    });

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

    const user = await User.findById(req.user.id)
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

    const {
      bio,
      phone,
      address,
    } = req.body;

    const user = await User.findById(req.user.id)
      .populate("profile");

    if (!user.profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    const profile = await Profile.findById(user.profile._id);

    profile.bio = bio || profile.bio;
    profile.phone = phone || profile.phone;
    profile.address = address || profile.address;


    // IMAGE UPDATE
    if (req.file) {

      // DELETE OLD IMAGE
      if (profile.profileImage.public_id) {

        await cloudinary.uploader.destroy(
          profile.profileImage.public_id
        );
      }

      // UPLOAD NEW IMAGE
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "profiles",
      });

      profile.profileImage = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    }

    await profile.save();

    res.status(200).json({
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




// DELETE PROFILE IMAGE
exports.deleteProfileImage = async (req, res) => {

  try {

    const user = await User.findById(req.user.id)
      .populate("profile");

    const profile = await Profile.findById(user.profile._id);

    if (profile.profileImage.public_id) {

      await cloudinary.uploader.destroy(
        profile.profileImage.public_id
      );

      profile.profileImage = {
        public_id: "",
        url: "",
      };

      await profile.save();
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