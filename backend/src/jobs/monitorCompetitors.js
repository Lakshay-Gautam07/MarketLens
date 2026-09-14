'use strict';

/**
 * monitorCompetitors.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Schedules the monitoring service on a cron expression defined in the
 * environment variable MONITOR_CRON (defaults to every 6 hours).
 *
 * Also exports `runOnce` so the job can be triggered manually
 * (e.g. from an API route or the manual trigger script).
 *
 * Usage inside server.js:
 *   const { startMonitorJob } = require('./jobs/monitorCompetitors');
 *   startMonitorJob();           // call after DB is connected
 *
 * Environment variables:
 *   MONITOR_CRON       cron expression (default: "0 *\/6 * * *"  → every 6h)
 *   MONITOR_RUN_ON_START  "true" → also runs one cycle immediately on startup
 * ─────────────────────────────────────────────────────────────────────────────
 */

const cron = require('node-cron');
const { runMonitoringCycle } = require('../services/monitoringService');

// ── Defaults ──────────────────────────────────────────────────────────────────
const DEFAULT_CRON = '0 */6 * * *'; // every 6 hours

// ── State ─────────────────────────────────────────────────────────────────────
let scheduledTask = null;
let isRunning     = false; // guard against overlapping cron executions

// ── Internal runner ───────────────────────────────────────────────────────────

/**
 * Executes one monitoring cycle, guarded against overlapping runs.
 * Errors are caught and logged so the cron never crashes the process.
 */
const safeRun = async () => {
  if (isRunning) {
    console.warn('[MonitorJob] Previous cycle still running — skipping this tick.');
    return null;
  }

  isRunning = true;
  try {
    const summary = await runMonitoringCycle();
    return summary;
  } catch (err) {
    console.error('[MonitorJob] Cycle threw an unexpected error:', err.message);
    console.error(err.stack);
    return null;
  } finally {
    isRunning = false;
  }
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Start the scheduled monitoring job.
 * Call this once, after MongoDB is connected.
 *
 * @returns {object} The node-cron task instance
 */
const startMonitorJob = () => {
  const expression = process.env.MONITOR_CRON || DEFAULT_CRON;
  const runOnStart  = process.env.MONITOR_RUN_ON_START === 'true';

  if (!cron.validate(expression)) {
    console.error(
      `[MonitorJob] ❌  Invalid MONITOR_CRON expression: "${expression}". ` +
      `Falling back to default: "${DEFAULT_CRON}"`
    );
  }

  const validExpression = cron.validate(expression) ? expression : DEFAULT_CRON;

  console.log(`[MonitorJob] ✅  Scheduled with cron: "${validExpression}"`);

  scheduledTask = cron.schedule(validExpression, () => {
    console.log('[MonitorJob] ⏰  Cron tick — starting monitoring cycle…');
    safeRun();
  }, {
    timezone: 'UTC',
  });

  // Optionally kick off one cycle immediately on startup
  if (runOnStart) {
    console.log('[MonitorJob] 🚀  MONITOR_RUN_ON_START=true — running initial cycle…');
    safeRun();
  }

  return scheduledTask;
};

/**
 * Stop the scheduled job (useful for graceful shutdown or tests).
 */
const stopMonitorJob = () => {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('[MonitorJob] 🛑  Cron job stopped.');
  }
};

/**
 * Manually trigger one monitoring cycle (bypasses the schedule).
 * Awaitable — resolves with the cycle summary.
 *
 * @returns {Promise<object|null>} Cycle summary or null if already running
 */
const runOnce = () => safeRun();

module.exports = { startMonitorJob, stopMonitorJob, runOnce };
