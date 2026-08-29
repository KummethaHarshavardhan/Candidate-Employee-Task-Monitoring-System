const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    submission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission',
      required: true,
    },
    taskAssignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaskAssignment',
      required: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    comments: {
      type: String,
      required: [true, 'Please provide review comments or feedback'],
      trim: true,
    },
    decision: {
      type: String,
      enum: ['APPROVED', 'REWORK_REQUIRED'],
      required: [true, 'Please specify review decision (APPROVED or REWORK_REQUIRED)'],
    },
    reviewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ taskAssignment: 1, reviewedAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);