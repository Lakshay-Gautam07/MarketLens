'use strict';

const mongoose = require('mongoose');
const { AIInsight } = require('../models');

/**
 * GET /api/insights
 * List AI insights with pagination and optional confidence filtering.
 */
const getInsights = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.minConfidence !== undefined) {
      const minConf = parseFloat(req.query.minConfidence);
      if (!isNaN(minConf)) {
        filter.confidence = { $gte: minConf };
      }
    }

    if (req.query.changeId && mongoose.Types.ObjectId.isValid(req.query.changeId)) {
      filter.changeId = req.query.changeId;
    }

    const [total, insights] = await Promise.all([
      AIInsight.countDocuments(filter),
      AIInsight.find(filter)
        .populate({
          path: 'changeId',
          select: 'title category significance detectedAt url competitorId sourceId',
          populate: [
            { path: 'competitorId', select: 'name category logo' },
            { path: 'sourceId', select: 'name type url' },
          ],
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return res.status(200).json({
      status: 'ok',
      data: insights,
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
 * GET /api/insights/:changeId
 * Retrieve the AI insight associated with a specific Change (or by Insight ID).
 */
const getInsightByChangeId = async (req, res, next) => {
  try {
    const { changeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(changeId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid ID format — must be a 24-character MongoDB ObjectId',
      });
    }

    // Match either changeId ref or the insight's own _id
    const insight = await AIInsight.findOne({
      $or: [{ changeId }, { _id: changeId }],
    })
      .populate({
        path: 'changeId',
        select: 'title description category significance detectedAt previousValue newValue url competitorId sourceId',
        populate: [
          { path: 'competitorId', select: 'name category logo website' },
          { path: 'sourceId', select: 'name type url' },
        ],
      })
      .lean();

    if (!insight) {
      return res.status(404).json({
        status: 'error',
        message: `No AI insight found for Change or Insight ID: ${changeId}`,
      });
    }

    return res.status(200).json({
      status: 'ok',
      data: insight,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getInsights,
  getInsightByChangeId,
};
