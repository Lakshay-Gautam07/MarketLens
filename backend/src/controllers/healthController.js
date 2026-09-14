'use strict';

const { version } = require('../../package.json');

/**
 * GET /api/health
 * Returns a lightweight liveness check payload.
 */
const getHealth = (_req, res) => {
  res.status(200).json({
    status: 'ok',
    version,
    environment: process.env.NODE_ENV || 'development',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
};

module.exports = { getHealth };
