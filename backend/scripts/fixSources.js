'use strict';

/**
 * scripts/fixSources.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Corrects Source URLs that returned 404 during the initial monitoring run.
 * Uses upsert-style updates keyed on (competitorId, name) so it's safe to
 * re-run at any time.
 *
 * Usage:
 *   node scripts/fixSources.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const { Competitor, Source } = require('../src/models');

const FIXES = [
  // Asana blog moved to /resources
  {
    competitorName: 'Asana',
    sourceName: 'Asana Blog',
    newUrl: 'https://asana.com/resources',
  },
  // Asana RSS feed
  {
    competitorName: 'Asana',
    sourceName: 'Asana Blog RSS',
    newUrl: 'https://asana.com/resources/rss.xml',
    // If that's also 404, disable rather than persist a broken source
    fallbackActive: false,
  },
  // ClickUp product updates blog path changed
  {
    competitorName: 'ClickUp',
    sourceName: 'ClickUp Product Updates',
    newUrl: 'https://clickup.com/blog/category/product-updates/',
  },
  // Notion blog RSS path
  {
    competitorName: 'Notion',
    sourceName: 'Notion Blog RSS',
    newUrl: 'https://www.notion.so/blog',
    type: 'blog', // downgrade to blog type since RSS isn't available
  },
];

const run = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌  MONGODB_URI not set.');
    process.exit(1);
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log(`✅  Connected: ${mongoose.connection.host}\n`);

  for (const fix of FIXES) {
    const competitor = await Competitor.findOne({ name: fix.competitorName }).lean();
    if (!competitor) {
      console.warn(`   ⚠  Competitor not found: ${fix.competitorName}`);
      continue;
    }

    const update = {
      url: fix.newUrl,
      contentHash: null,   // reset so monitoring baselines the new URL
      lastError: null,
    };
    if (fix.type) update.type = fix.type;

    const doc = await Source.findOneAndUpdate(
      { competitorId: competitor._id, name: fix.sourceName },
      { $set: update },
      { new: true }
    );

    if (!doc) {
      console.warn(`   ⚠  Source not found: ${fix.competitorName} / ${fix.sourceName}`);
    } else {
      console.log(`   ✔  Fixed: ${fix.competitorName} / ${fix.sourceName} → ${fix.newUrl}`);
    }
  }

  await mongoose.disconnect();
  console.log('\n🔌  Done.');
  process.exit(0);
};

run().catch((err) => {
  console.error('❌  Fix failed:', err.message);
  process.exit(1);
});
