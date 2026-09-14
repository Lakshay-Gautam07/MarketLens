'use strict';

/**
 * scripts/runMonitor.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Manually triggers one full monitoring cycle against your real MongoDB.
 * Useful for testing changes to the monitoring/detection logic without
 * waiting for the cron schedule.
 *
 * Usage:
 *   node scripts/runMonitor.js
 *
 * Requires MONGODB_URI in .env (or exported in the shell).
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const { runMonitoringCycle } = require('../src/services/monitoringService');

const run = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌  MONGODB_URI is not set. Create a .env file first (see .env.example).');
    process.exit(1);
  }

  console.log('🔌  Connecting to MongoDB…');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log(`✅  Connected: ${mongoose.connection.host}\n`);

  const summary = await runMonitoringCycle();

  console.log('\n── Summary ───────────────────────────────────');
  console.log(`  Competitors : ${summary.competitors}`);
  console.log(`  Sources     : ${summary.sources}`);
  console.log(`  Changes     : ${summary.changesDetected}`);
  console.log(`  Errors      : ${summary.errors}`);
  console.log(`  Duration    : ${(summary.durationMs / 1000).toFixed(1)}s`);
  console.log('──────────────────────────────────────────────\n');

  await mongoose.disconnect();
  console.log('🔌  Disconnected.');
  process.exit(0);
};

run().catch((err) => {
  console.error('❌  Monitor run failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
