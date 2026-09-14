'use strict';

const mongoose = require('mongoose');

/**
 * Source
 * A data source being monitored for a given competitor.
 * Examples: blog RSS feed, pricing page, changelog page, Twitter/X, GitHub.
 */
const sourceSchema = new mongoose.Schema(
  {
    competitorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Competitor',
      required: [true, 'competitorId is required'],
      index: true,
    },

    type: {
      type: String,
      required: [true, 'Source type is required'],
      enum: {
        values: ['blog', 'pricing', 'changelog', 'social', 'github', 'website', 'rss', 'other'],
        message: 'type must be one of: blog, pricing, changelog, social, github, website, rss, other',
      },
    },

    url: {
      type: String,
      required: [true, 'Source URL is required'],
      trim: true,
      match: [/^https?:\/\/.+/, 'URL must be a valid URL'],
    },

    name: {
      type: String,
      required: [true, 'Source name is required'],
      trim: true,
      maxlength: [150, 'Name cannot exceed 150 characters'],
    },

    lastCheckedAt: {
      type: Date,
      default: null,
    },

    // SHA-256 hash of the last seen normalised content.
    // Used by the monitoring service to detect changes between runs.
    contentHash: {
      type: String,
      default: null,
    },

    // Last error message from a failed fetch attempt (for debugging).
    lastError: {
      type: String,
      default: null,
      maxlength: 500,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'sources',
  }
);

// Composite index: fetch all active sources for a competitor efficiently
sourceSchema.index({ competitorId: 1, active: 1, type: 1 });

module.exports = mongoose.model('Source', sourceSchema);
