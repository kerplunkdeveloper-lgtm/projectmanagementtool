const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({

  bio: {
    type: String,
    default: "",
  },

  phone: {
    type: String,
    default: "",
  },

  address: {
    type: String,
    default: "",
  },

  profileImage: {
    public_id: {
      type: String,
      default: "",
    },

    url: {
      type: String,
      default: "",
    },
  },

}, {
  timestamps: true,
});

module.exports = mongoose.model("Profile", profileSchema);