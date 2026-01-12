// src/models/User.js
// ESM – User Model (Mongoose)

import mongoose from 'mongoose';

const { Schema } = mongoose;

// =====================================================
// User Schema
// =====================================================
const UserSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 3,
            maxlength: 32,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Ungültige E-Mail-Adresse'],
        },

        passwordHash: {
            type: String,
            required: true,
        },

        role: {
            type: String,
            enum: ['technician', 'admin', 'qc', 'analyzer'],
            default: 'technician',
        },

        status: {
            type: String,
            enum: ['active', 'disabled', 'pending'],
            default: 'active',
        },

        lastLoginAt: {
            type: Date,
        },

        failedLoginAttempts: {
            type: Number,
            default: 0,
        },

        lockUntil: {
            type: Date,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// =====================================================
// Indexes
// =====================================================
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });

// =====================================================
// Instance Methods
// =====================================================
UserSchema.methods.isLocked = function () {
    return this.lockUntil && this.lockUntil > Date.now();
};

// =====================================================
// Static Helpers
// =====================================================
UserSchema.statics.findByIdentifier = function (identifier) {
    return this.findOne({
        $or: [{ email: identifier }, { username: identifier }],
    });
};

// =====================================================
// Export Model (Safe for Hot-Reload)
// =====================================================
const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;