import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ["Admin", "User", "Municipality Staff"], default: "User" },
  accountVerified: { type: Boolean, default: false },

  // New fields
  issuesParticipated: [
    {
      issueId: { type: mongoose.Schema.Types.ObjectId, ref: "Issue" },
      participationDate: { type: Date, default: Date.now }
    }
  ],

  tasksAlloted: [
    {
      taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
      assignedDate: { type: Date, default: Date.now }
    }
  ],

  avatar: { type: String },
  location: { type: String },
  district: { type: String },
  state: { type: String },
  country: { type: String },
  availability: {
    weekdays: { type: Boolean, default: false },
    weekends: { type: Boolean, default: false }
  },

  verificationCode: Number,
  verificationCodeExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, {
  timestamps: true
});

// JWT Token
userSchema.methods.generateToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Verification Code
userSchema.methods.generateVerificationCode = function () {
  function generateRandomFiveDigitNumber() {
    const firstDigit = Math.floor(Math.random() * 9) + 1;
    const remainingDigits = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return parseInt(firstDigit + remainingDigits);
  }

  const verificationCode = generateRandomFiveDigitNumber();
  this.verificationCode = verificationCode;
  this.verificationCodeExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
  return verificationCode;
};

// Reset Password Token
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  this.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
  return resetToken;
};

export const User = mongoose.model("User", userSchema);
