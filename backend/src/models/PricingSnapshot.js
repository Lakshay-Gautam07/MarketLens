'use strict';

const mongoose = require('mongoose');

/**
 * PricingPlan sub-document
 * Represents a single pricing tier within a snapshot.
 */
const pricingPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
      maxlength: [100, 'Plan name cannot exceed 100 characters'],
    },

    price: {
      type: Number,
      // null = free or contact-sales
      default: null,
    },

    billingPeriod: {
      type: String,
      enum: {
        values: ['monthly', 'annual', 'one-time', 'custom'],
        message: 'billingPeriod must be one of: monthly, annual, one-time, custom',
      },
      default: 'monthly',
    },

    features: {
      type: [String],
      default: [],
    },

    isFree: {
      type: Boolean,
      default: false,
    },

    isEnterprise: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

/**
 * PricingSnapshot
 * A point-in-time capture of a competitor's pricing page.
 */
const pricingSnapshotSchema = new mongoose.Schema(
  {
    competitorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Competitor',
      required: [true, 'competitorId is required'],
      index: true,
    },

    capturedAt: {
      type: Date,
      required: [true, 'capturedAt is required'],
      default: Date.now,
      index: true,
    },

    plans: {
      type: [pricingPlanSchema],
      default: [],
    },

    currency: {
      type: String,
      required: [true, 'Currency is required'],
      trim: true,
      uppercase: true,
      default: 'USD',
      match: [/^[A-Z]{3}$/, 'Currency must be a valid 3-letter ISO code (e.g. USD)'],
    },
  },
  {
    timestamps: true,
    collection: 'pricing_snapshots',
  }
);

// Compound index: get latest snapshot per competitor efficiently
pricingSnapshotSchema.index({ competitorId: 1, capturedAt: -1 });

module.exports = mongoose.model('PricingSnapshot', pricingSnapshotSchema);
