'use strict';

const mongoose = require('mongoose');
const { Competitor, Source } = require('../models');

/**
 * GET /api/competitors
 * List competitors with optional filtering (active, category, search) and pagination.
 */
const getCompetitors = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.active !== undefined) {
      filter.active = req.query.active === 'true';
    }

    if (req.query.category) {
      filter.category = req.query.category.trim();
    }

    if (req.query.search) {
      filter.name = { $regex: req.query.search.trim(), $options: 'i' };
    }

    const [total, competitors] = await Promise.all([
      Competitor.countDocuments(filter),
      Competitor.find(filter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return res.status(200).json({
      status: 'ok',
      data: competitors,
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
 * GET /api/competitors/:id
 * Retrieve a specific competitor by ID with its monitored sources.
 */
const getCompetitorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid competitor ID format',
      });
    }

    const competitor = await Competitor.findById(id).lean();

    if (!competitor) {
      return res.status(404).json({
        status: 'error',
        message: `Competitor not found with ID: ${id}`,
      });
    }

    const sources = await Source.find({ competitorId: id })
      .sort({ type: 1, name: 1 })
      .lean();

    return res.status(200).json({
      status: 'ok',
      data: {
        ...competitor,
        sources,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCompetitors,
  getCompetitorById,
};
