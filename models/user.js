const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      minlength: 3,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: /.+\@.+\..+/,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
