'use strict';

/**
 * Barrel export for all Mongoose models.
 * Import from here instead of individual files:
 *   const { Competitor, Source } = require('../models');
 */
module.exports = {
  Competitor: require('./Competitor'),
  Source: require('./Source'),
  Change: require('./Change'),
  AIInsight: require('./AIInsight'),
  PricingSnapshot: require('./PricingSnapshot'),
  WeeklyReport: require('./WeeklyReport'),
};
