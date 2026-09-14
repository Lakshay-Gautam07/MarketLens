'use strict';

// ── Load environment variables first (before any other imports) ───────────────
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const config = require('./config');
const connectDB = require('./config/db');
const routes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const { startMonitorJob, stopMonitorJob } = require('./jobs/monitorCompetitors');

// ── App setup ─────────────────────────────────────────────────────────────────
const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, Postman, mobile apps)
      if (!origin) return callback(null, true);

      if (config.cors.allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error(`CORS policy: origin '${origin}' not allowed`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ── Request logging ───────────────────────────────────────────────────────────
app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api', routes);

// ── 404 handler (must come after all valid routes) ────────────────────────────
app.use(notFound);

// ── Global error handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────────────────
const start = async () => {
  await connectDB();

  // Start the competitor monitoring cron job
  startMonitorJob();

  const server = app.listen(config.port, () => {
    console.log(
      `🚀  MarketLens API running on port ${config.port} [${config.env}]`
    );
    console.log(`   Health → http://localhost:${config.port}/api/health`);
  });

  // ── Graceful shutdown ─────────────────────────────────────────────────────
  const shutdown = (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully…`);
    stopMonitorJob();
    server.close(() => {
      console.log('✅  HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

start().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});

module.exports = app; // exported for testing
