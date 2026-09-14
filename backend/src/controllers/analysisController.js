'use strict';

const { analyseChange } = require('../services/aiService');
const { Change, AIInsight } = require('../models');

/**
 * POST /api/analysis/changes/:changeId
 * Trigger AI analysis for a specific Change.
 * Returns the AIInsight (from cache if already analysed).
 */
const analyseChangeHandler = async (req, res, next) => {
  try {
    const { changeId } = req.params;

    if (!changeId || !/^[a-f\d]{24}$/i.test(changeId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid changeId — must be a 24-character MongoDB ObjectId',
      });
    }

    const insight = await analyseChange(changeId);

    return res.status(200).json({
      status: 'ok',
      data: insight,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/analysis/changes/:changeId
 * Retrieve an existing AIInsight for a Change without triggering generation.
 * Returns 404 if no insight exists yet.
 */
const getInsightHandler = async (req, res, next) => {
  try {
    const { changeId } = req.params;

    if (!changeId || !/^[a-f\d]{24}$/i.test(changeId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid changeId — must be a 24-character MongoDB ObjectId',
      });
    }

    const insight = await AIInsight.findOne({ changeId }).lean();

    if (!insight) {
      return res.status(404).json({
        status: 'error',
        message: 'No AI insight found for this change. POST to this endpoint to generate one.',
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

/**
 * GET /api/analysis/changes
 * List all Changes that have (or optionally lack) an associated AIInsight.
 * Query params:
 *   ?analysed=true   → only changes that have an insight
 *   ?analysed=false  → only changes without an insight (default)
 *   ?limit=N         → max results (default 20)
 */
const listChangesHandler = async (req, res, next) => {
  try {
    const limit    = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const analysed = req.query.analysed === 'true';

    // IDs of changes that already have insights
    const analysedIds = await AIInsight.distinct('changeId');

    const filter = analysed
      ? { _id: { $in: analysedIds } }
      : { _id: { $nin: analysedIds } };

    const changes = await Change.find(filter)
      .populate('competitorId', 'name category')
      .populate('sourceId', 'name type')
      .sort({ detectedAt: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      status: 'ok',
      count: changes.length,
      data: changes,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { analyseChangeHandler, getInsightHandler, listChangesHandler };
