'use strict';

/**
 * notFound
 * Catches any request that didn't match a registered route and
 * forwards a structured 404 error to the global error handler.
 */
const notFound = (req, _res, next) => {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
};

module.exports = notFound;
