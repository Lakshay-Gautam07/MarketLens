'use strict';

const mongoose = require('mongoose');

/**
 * AIInsight
 * Stores AI-generated strategic analysis for a specific Change.
 * One Change can have at most one AIInsight (enforced via unique index).
 */
const aiInsightSchema = new mongoose.Schema(
  {
    changeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Change',
      required: [true, 'changeId is required'],
      unique: true, // one insight per change
      index: true,
    },

    summary: {
      type: String,
      required: [true, 'Summary is required'],
      trim: true,
      maxlength: [2000, 'Summary cannot exceed 2000 characters'],
    },

    strategicImpact: {
      type: String,
      trim: true,
      maxlength: [2000, 'strategicImpact cannot exceed 2000 characters'],
    },

    competitorAdvantage: {
      type: String,
      trim: true,
      maxlength: [2000, 'competitorAdvantage cannot exceed 2000 characters'],
    },

    recommendedAction: {
      type: String,
      trim: true,
      maxlength: [2000, 'recommendedAction cannot exceed 2000 characters'],
    },

    affectedSegment: {
      type: String,
      trim: true,
      maxlength: [500, 'affectedSegment cannot exceed 500 characters'],
      // e.g. "SMB", "Enterprise", "Developers", "Marketing teams"
    },

    confidence: {
      type: Number,
      min: [0, 'Confidence must be between 0 and 1'],
      max: [1, 'Confidence must be between 0 and 1'],
      // 0.0–1.0 representing model confidence in the insight
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // updatedAt useful if insight is regenerated
    timestamps: { createdAt: false, updatedAt: 'updatedAt' },
    collection: 'ai_insights',
  }
);

module.exports = mongoose.model('AIInsight', aiInsightSchema);
