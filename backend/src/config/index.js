'use strict';

/**
 * Centralised application configuration.
 * All values are read from environment variables; no defaults contain secrets.
 */
const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,

  db: {
    uri: process.env.MONGODB_URI,
  },

  cors: {
    // Accept a comma-separated list of origins from the environment
    allowedOrigins: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
      : ['http://localhost:3000', 'http://localhost:5173'],
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
  },
};

module.exports = config;
