const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
  },

  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
  },

  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false,
  },

  role: {
    type: String,
    enum: ['admin', 'operationmanager', 'team'],
    default: 'team',
  },



  department: {
    type: String,

    enum: [
      "Social Media Team",
      "Website Team",
      "Designer Team",
      "Editor Team",
      "Scriptwriter Team",
      "Cameraman Team",
      "SEO Team",
    ],

    required: function () {
      return this.role === "team";
    },
  },




  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Encrypt password
userSchema.pre('save', async function () {

  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);

  this.password = await bcrypt.hash(this.password, salt);
});

// Generate JWT
userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE,
    }
  );
};

// Match Password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);