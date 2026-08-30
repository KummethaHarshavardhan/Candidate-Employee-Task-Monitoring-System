const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
      match: [
        /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/,
        "Password must contain at least 8 characters, one uppercase letter, one number, and one special character",
      ],
    },
    role: {
      type: String,
      enum: ['ADMIN', 'REVIEWER', 'CANDIDATE'],
      default: 'CANDIDATE',
    },
    team: {
      type: String,
      trim: true,
      default: 'General',
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      default: null,
    },
    // OTP-based Password Reset Fields
    passwordResetOtpHash: {
      type: String,
      select: false,
    },
    passwordResetOtpExpires: {
      type: Date,
      select: false,
    },
    passwordResetOtpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    passwordResetOtpLastSent: {
      type: Date,
      select: false,
    },
    passwordResetAuthTokenHash: {
      type: String,
      select: false,
    },
    passwordResetAuthExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);