const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please provide candidate name'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Please provide candidate email'],
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
        department: {
            type: String,
            required: [true, 'Please specify a department'],
            trim: true,
        },
        designation: {
            type: String,
            required: [true, 'Please specify a designation'],
            trim: true,
        },
        team: {
            type: String,
            required: [true, 'Please specify a team'],
            trim: true,
        },
        joiningDate: {
            type: Date,
            default: Date.now,
        },
        status: {
            type: String,
            enum: ['ACTIVE', 'INACTIVE'],
            default: 'ACTIVE',
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Candidate', candidateSchema);