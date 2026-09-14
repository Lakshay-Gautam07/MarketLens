'use strict';

const mongoose = require('mongoose');

/**
 * Change
 * A detected change at a specific source for a competitor.
 * e.g. pricing page updated, new blog post, feature released.
 */
const changeSchema = new mongoose.Schema(
  {
    competitorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Competitor',
      required: [true, 'competitorId is required'],
      index: true,
    },

    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Source',
      required: [true, 'sourceId is required'],
      index: true,
    },

    title: {
      type: String,
      required: [true, 'Change title is required'],
      trim: true,
      maxlength: [250, 'Title cannot exceed 250 characters'],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },

    url: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, 'URL must be a valid URL'],
    },

    detectedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: [
          'pricing',
          'product',
          'marketing',
          'hiring',
          'partnership',
          'funding',
          'blog',
          'changelog',
          'other',
        ],
        message: 'Invalid change category',
      },
    },

    previousValue: {
      type: String,
      trim: true,
      maxlength: [2000, 'previousValue cannot exceed 2000 characters'],
    },

    newValue: {
      type: String,
      trim: true,
      maxlength: [2000, 'newValue cannot exceed 2000 characters'],
    },

    significance: {
      type: String,
      required: [true, 'Significance is required'],
      enum: {
        values: ['low', 'medium', 'high', 'critical'],
        message: 'significance must be one of: low, medium, high, critical',
      },
      default: 'medium',
    },

    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['new', 'reviewed', 'actioned', 'dismissed'],
        message: 'status must be one of: new, reviewed, actioned, dismissed',
      },
      default: 'new',
    },
  },
  {
    timestamps: true,
    collection: 'changes',
  }
);

// Compound index: timeline queries per competitor + recency
changeSchema.index({ competitorId: 1, detectedAt: -1 });
// Support filtering by significance and status for dashboards
changeSchema.index({ significance: 1, status: 1 });

module.exports = mongoose.model('Change', changeSchema);
