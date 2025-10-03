import mongoose from "mongoose"
import jwt from "jsonwebtoken"
import crypto from "crypto"

const municipalitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    municipalityName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    accountVerified: {
        type: Boolean,
        default: false
    },
    accountApproved: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: ["Municipality Admin"],
        default: "Municipality Admin",
    },
    avatar: { type: String },
    location: { type: String },

    verificationCode: Number,
    verificationCodeExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date
}, {
    timestamps: true
});

municipalitySchema.methods.generateToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    })
}

municipalitySchema.methods.generateVerificationCode = function () {
    function geenerateRandomFiveDigitNumber() {
        const firstDigit = Math.floor(Math.random() * 9) + 1;
        const remainingDigits = Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, 0);
        return parseInt(firstDigit + remainingDigits);
    }

    const verificationCode = geenerateRandomFiveDigitNumber();
    this.verificationCode = verificationCode;
    this.verificationCodeExpire = Date.now() + 15 * 60 * 1000;
    return verificationCode;
};

municipalitySchema.methods.getResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(20).toString('hex');
    this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    this.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    return resetToken;
}

export const Municipality = mongoose.model("Municipality", municipalitySchema);
