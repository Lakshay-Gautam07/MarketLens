'use strict';

const mongoose = require('mongoose');
const { PricingSnapshot, Competitor } = require('../models');

/**
 * GET /api/pricing
 * List pricing snapshots across all competitors with pagination and optional filtering.
 */
const getPricing = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.competitorId && mongoose.Types.ObjectId.isValid(req.query.competitorId)) {
      filter.competitorId = req.query.competitorId;
    }

    if (req.query.currency) {
      filter.currency = req.query.currency.trim().toUpperCase();
    }

    const [total, snapshots] = await Promise.all([
      PricingSnapshot.countDocuments(filter),
      PricingSnapshot.find(filter)
        .populate('competitorId', 'name category logo website')
        .sort({ capturedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return res.status(200).json({
      status: 'ok',
      data: snapshots,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/pricing/:competitorId
 * Retrieve the latest pricing snapshot and snapshot history for a specific competitor.
 */
const getPricingByCompetitor = async (req, res, next) => {
  try {
    const { competitorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(competitorId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid competitor ID format — must be a 24-character MongoDB ObjectId',
      });
    }

    const competitor = await Competitor.findById(competitorId)
      .select('name category logo website description')
      .lean();

    if (!competitor) {
      return res.status(404).json({
        status: 'error',
        message: `Competitor not found with ID: ${competitorId}`,
      });
    }

    const snapshots = await PricingSnapshot.find({ competitorId })
      .sort({ capturedAt: -1 })
      .lean();

    return res.status(200).json({
      status: 'ok',
      data: {
        competitor,
        latest: snapshots[0] || null,
        history: snapshots,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPricing,
  getPricingByCompetitor,
};
