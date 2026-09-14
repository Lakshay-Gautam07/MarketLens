'use strict';

const mongoose = require('mongoose');

/**
 * WeeklyReport
 * A synthesised weekly intelligence report covering all tracked competitors.
 * keyChanges, strategicSignals, and recommendations are arrays of strings
 * to keep the schema flexible for both manual edits and AI generation.
 */
const weeklyReportSchema = new mongoose.Schema(
  {
    weekStart: {
      type: Date,
      required: [true, 'weekStart is required'],
    },

    weekEnd: {
      type: Date,
      required: [true, 'weekEnd is required'],
    },

    keyChanges: {
      type: [String],
      default: [],
      // Bullet-point summaries of notable competitor changes this week
    },

    strategicSignals: {
      type: [String],
      default: [],
      // Patterns or trends inferred across multiple competitors
    },

    recommendations: {
      type: [String],
      default: [],
      // Actionable items for the product/marketing/sales team
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // updatedAt useful if report is regenerated mid-week
    timestamps: { createdAt: false, updatedAt: 'updatedAt' },
    collection: 'weekly_reports',
  }
);

// Prevent duplicate reports for the same week
weeklyReportSchema.index({ weekStart: 1 }, { unique: true });

module.exports = mongoose.model('WeeklyReport', weeklyReportSchema);
