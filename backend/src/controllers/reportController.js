'use strict';

const mongoose = require('mongoose');
const { WeeklyReport } = require('../models');

/**
 * GET /api/reports
 * List intelligence reports with pagination.
 */
const getReports = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [total, reports] = await Promise.all([
      WeeklyReport.countDocuments(),
      WeeklyReport.find()
        .sort({ weekStart: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return res.status(200).json({
      status: 'ok',
      data: reports,
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
 * GET /api/reports/:id
 * Retrieve a specific report by ID.
 */
const getReportById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid report ID format — must be a 24-character MongoDB ObjectId',
      });
    }

    const report = await WeeklyReport.findById(id).lean();

    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: `Report not found with ID: ${id}`,
      });
    }

    return res.status(200).json({
      status: 'ok',
      data: report,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getReports,
  getReportById,
};
