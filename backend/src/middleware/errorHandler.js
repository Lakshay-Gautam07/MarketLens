'use strict';

/**
 * errorHandler
 * Global Express error-handling middleware (4-argument signature required).
 *
 * - Hides stack traces in production
 * - Normalises Mongoose validation errors to 422
 * - Normalises duplicate-key errors (E11000) to 409
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  const isDev = process.env.NODE_ENV !== 'production';

  // ── Mongoose validation error ───────────────────────────────────────────────
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(422).json({
      status: 'error',
      message: 'Validation failed',
      errors: messages,
    });
  }

  // ── MongoDB duplicate key ───────────────────────────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {}).join(', ');
    return res.status(409).json({
      status: 'error',
      message: `Duplicate value for field: ${field}`,
    });
  }

  // ── Generic error ───────────────────────────────────────────────────────────
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    status: 'error',
    message,
    ...(isDev && { stack: err.stack }),
  });
};

module.exports = errorHandler;
