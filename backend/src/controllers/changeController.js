'use strict';

const mongoose = require('mongoose');
const { Change, AIInsight, Competitor } = require('../models');

/**
 * GET /api/changes
 * List changes with filtering by competitor, category, significance, status, date, and pagination.
 */
const getChanges = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};

    // Competitor filter (supports either ObjectId or competitor name string)
    const competitorParam = req.query.competitor || req.query.competitorId;
    if (competitorParam) {
      if (mongoose.Types.ObjectId.isValid(competitorParam)) {
        filter.competitorId = competitorParam;
      } else {
        const found = await Competitor.findOne({
          name: { $regex: new RegExp(`^${competitorParam.trim()}$`, 'i') },
        }).select('_id');
        if (found) {
          filter.competitorId = found._id;
        } else {
          // If named competitor doesn't exist, return empty result
          return res.status(200).json({
            status: 'ok',
            data: [],
            pagination: { page, limit, total: 0, totalPages: 0 },
          });
        }
      }
    }

    // Category filter
    if (req.query.category) {
      filter.category = req.query.category.trim().toLowerCase();
    }

    // Significance filter
    if (req.query.significance) {
      filter.significance = req.query.significance.trim().toLowerCase();
    }

    // Status filter
    if (req.query.status) {
      filter.status = req.query.status.trim().toLowerCase();
    }

    // Date filtering (supports startDate/endDate, from/to, or specific date)
    const startDate = req.query.startDate || req.query.from;
    const endDate = req.query.endDate || req.query.to;
    const exactDate = req.query.date;

    if (exactDate) {
      const start = new Date(exactDate);
      if (!isNaN(start.getTime())) {
        const end = new Date(exactDate);
        end.setUTCDate(end.getUTCDate() + 1);
        filter.detectedAt = { $gte: start, $lt: end };
      }
    } else if (startDate || endDate) {
      filter.detectedAt = {};
      if (startDate) {
        const s = new Date(startDate);
        if (!isNaN(s.getTime())) filter.detectedAt.$gte = s;
      }
      if (endDate) {
        const e = new Date(endDate);
        if (!isNaN(e.getTime())) filter.detectedAt.$lte = e;
      }
      if (Object.keys(filter.detectedAt).length === 0) {
        delete filter.detectedAt;
      }
    }

    const [total, changes] = await Promise.all([
      Change.countDocuments(filter),
      Change.find(filter)
        .populate('competitorId', 'name category logo website')
        .populate('sourceId', 'name type url')
        .sort({ detectedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return res.status(200).json({
      status: 'ok',
      data: changes,
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
 * GET /api/changes/:id
 * Retrieve a specific change by ID, including populated refs and associated AIInsight if present.
 */
const getChangeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid change ID format',
      });
    }

    const change = await Change.findById(id)
      .populate('competitorId', 'name category logo website description')
      .populate('sourceId', 'name type url')
      .lean();

    if (!change) {
      return res.status(404).json({
        status: 'error',
        message: `Change not found with ID: ${id}`,
      });
    }

    // Attach AIInsight if already generated for this change
    const insight = await AIInsight.findOne({ changeId: id }).lean();

    return res.status(200).json({
      status: 'ok',
      data: {
        ...change,
        insight: insight || null,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getChanges,
  getChangeById,
};
