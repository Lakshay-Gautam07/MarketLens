'use strict';

const mongoose = require('mongoose');

/**
 * Competitor
 * Represents a tracked competitor company.
 */
const competitorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Competitor name is required'],
      trim: true,
      unique: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    website: {
      type: String,
      required: [true, 'Website URL is required'],
      trim: true,
      match: [/^https?:\/\/.+/, 'Website must be a valid URL'],
    },

    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      // e.g. "Project Management", "CRM", "Analytics"
    },

    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },

    logo: {
      type: String,
      trim: true,
      // URL to the competitor's logo image
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // adds createdAt, updatedAt
    collection: 'competitors',
  }
);

// Index for fast active-competitor queries
competitorSchema.index({ active: 1, name: 1 });

module.exports = mongoose.model('Competitor', competitorSchema);
