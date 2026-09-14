'use strict';

/**
 * Barrel export for all background jobs.
 * Import from here to keep consumer paths stable.
 */
module.exports = {
  monitorCompetitors: require('./monitorCompetitors'),
};
