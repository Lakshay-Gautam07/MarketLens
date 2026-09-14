'use strict';

/**
 * seed.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Populates MongoDB with initial Competitor + Source records.
 *
 * Usage:
 *   node scripts/seed.js
 *
 * Requires MONGODB_URI in .env (or exported in the shell).
 * Safe to re-run: uses upsert so duplicates are never created.
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const { Competitor, Source, PricingSnapshot, WeeklyReport } = require('../src/models');

// ── Seed data ─────────────────────────────────────────────────────────────────

const competitors = [
  {
    name: 'Notion',
    website: 'https://www.notion.so',
    category: 'Project Management',
    description:
      'All-in-one workspace for notes, tasks, wikis, and databases. Popular with individuals, startups, and enterprises.',
    logo: 'https://www.notion.so/images/favicon.ico',
    active: true,
  },
  {
    name: 'ClickUp',
    website: 'https://clickup.com',
    category: 'Project Management',
    description:
      'Productivity platform that replaces multiple apps with tasks, docs, goals, and chat in one place.',
    logo: 'https://clickup.com/favicon.ico',
    active: true,
  },
  {
    name: 'Asana',
    website: 'https://asana.com',
    category: 'Project Management',
    description:
      'Work management platform designed to help teams organise, track, and manage their work.',
    logo: 'https://asana.com/favicon.ico',
    active: true,
  },
  {
    name: 'Linear',
    website: 'https://linear.app',
    category: 'Project Management',
    description:
      'Issue tracking and project management tool built for modern software teams. Known for speed and clean UX.',
    logo: 'https://linear.app/favicon.ico',
    active: true,
  },
];

/**
 * Given a resolved competitorId map, build the sources array.
 * All URLs are real, publicly accessible pages.
 */
const buildSources = (idMap) => [
  // ── Notion ───────────────────────────────────────────────────────────────
  {
    competitorId: idMap['Notion'],
    type: 'blog',
    name: 'Notion Blog',
    url: 'https://www.notion.so/blog',
    active: true,
  },
  {
    competitorId: idMap['Notion'],
    type: 'changelog',
    name: 'Notion What\'s New',
    url: 'https://www.notion.so/releases',
    active: true,
  },
  {
    competitorId: idMap['Notion'],
    type: 'pricing',
    name: 'Notion Pricing Page',
    url: 'https://www.notion.so/pricing',
    active: true,
  },
  {
    competitorId: idMap['Notion'],
    type: 'rss',
    name: 'Notion Blog RSS',
    url: 'https://www.notion.so/blog/rss.xml',
    active: true,
  },

  // ── ClickUp ──────────────────────────────────────────────────────────────
  {
    competitorId: idMap['ClickUp'],
    type: 'blog',
    name: 'ClickUp Blog',
    url: 'https://clickup.com/blog',
    active: true,
  },
  {
    competitorId: idMap['ClickUp'],
    type: 'changelog',
    name: 'ClickUp Product Updates',
    url: 'https://clickup.com/blog/clickup-product-updates',
    active: true,
  },
  {
    competitorId: idMap['ClickUp'],
    type: 'pricing',
    name: 'ClickUp Pricing Page',
    url: 'https://clickup.com/pricing',
    active: true,
  },
  {
    competitorId: idMap['ClickUp'],
    type: 'social',
    name: 'ClickUp Twitter/X',
    url: 'https://twitter.com/clickup',
    active: true,
  },

  // ── Asana ────────────────────────────────────────────────────────────────
  {
    competitorId: idMap['Asana'],
    type: 'blog',
    name: 'Asana Blog',
    url: 'https://asana.com/resources/blog',
    active: true,
  },
  {
    competitorId: idMap['Asana'],
    type: 'changelog',
    name: 'Asana Product News',
    url: 'https://asana.com/product',
    active: true,
  },
  {
    competitorId: idMap['Asana'],
    type: 'pricing',
    name: 'Asana Pricing Page',
    url: 'https://asana.com/pricing',
    active: true,
  },
  {
    competitorId: idMap['Asana'],
    type: 'rss',
    name: 'Asana Blog RSS',
    url: 'https://asana.com/resources/blog/rss.xml',
    active: true,
  },

  // ── Linear ───────────────────────────────────────────────────────────────
  {
    competitorId: idMap['Linear'],
    type: 'blog',
    name: 'Linear Blog',
    url: 'https://linear.app/blog',
    active: true,
  },
  {
    competitorId: idMap['Linear'],
    type: 'changelog',
    name: 'Linear Changelog',
    url: 'https://linear.app/changelog',
    active: true,
  },
  {
    competitorId: idMap['Linear'],
    type: 'pricing',
    name: 'Linear Pricing Page',
    url: 'https://linear.app/pricing',
    active: true,
  },
  {
    competitorId: idMap['Linear'],
    type: 'github',
    name: 'Linear GitHub',
    url: 'https://github.com/linear',
    active: true,
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────

const seed = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌  MONGODB_URI is not set. Create a .env file first (see .env.example).');
    process.exit(1);
  }

  console.log('🔌  Connecting to MongoDB…');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log(`✅  Connected: ${mongoose.connection.host}\n`);

  // ── Upsert competitors ───────────────────────────────────────────────────
  console.log('📦  Seeding competitors…');
  const competitorIdMap = {};

  for (const data of competitors) {
    const doc = await Competitor.findOneAndUpdate(
      { name: data.name },
      { $set: data },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    competitorIdMap[doc.name] = doc._id;
    console.log(`   ✔  ${doc.name} (${doc._id})`);
  }

  // ── Upsert sources ────────────────────────────────────────────────────────
  console.log('\n📡  Seeding sources…');
  const sources = buildSources(competitorIdMap);

  for (const data of sources) {
    const doc = await Source.findOneAndUpdate(
      { competitorId: data.competitorId, url: data.url },
      { $set: data },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`   ✔  [${doc.type.padEnd(10)}] ${doc.name}`);
  }

  // ── Upsert pricing snapshots ──────────────────────────────────────────────
  console.log('\n💰  Seeding pricing snapshots…');
  const pricingData = [
    {
      competitorId: competitorIdMap['Notion'],
      currency: 'USD',
      plans: [
        { name: 'Free', price: 0, billingPeriod: 'monthly', isFree: true, features: ['Collaborative workspace', 'Basic page analytics', '7 day page history'] },
        { name: 'Plus', price: 10, billingPeriod: 'monthly', features: ['Unlimited blocks', 'Unlimited file uploads', '30 day page history', 'Up to 100 guests'] },
        { name: 'Business', price: 18, billingPeriod: 'monthly', features: ['SAML SSO', 'Private teamspaces', 'Bulk export', '90 day page history'] },
        { name: 'Enterprise', price: null, billingPeriod: 'custom', isEnterprise: true, features: ['SCIM user provisioning', 'Audit log', 'Dedicated success manager'] },
      ],
    },
    {
      competitorId: competitorIdMap['Linear'],
      currency: 'USD',
      plans: [
        { name: 'Free', price: 0, billingPeriod: 'monthly', isFree: true, features: ['Unlimited members', '250 active issues', 'Integrations with GitHub & GitLab'] },
        { name: 'Standard', price: 8, billingPeriod: 'monthly', features: ['Unlimited issues', 'Admin roles', 'Guest accounts', 'Issue templates'] },
        { name: 'Plus', price: 14, billingPeriod: 'monthly', features: ['Linear Insights', 'Customer requests', 'SLA management', 'Zendesk & Intercom sync'] },
        { name: 'Enterprise', price: null, billingPeriod: 'custom', isEnterprise: true, features: ['SAML 2.0 / Okta SCIM', 'Advanced security', 'Dedicated Slack support'] },
      ],
    },
    {
      competitorId: competitorIdMap['ClickUp'],
      currency: 'USD',
      plans: [
        { name: 'Free Forever', price: 0, billingPeriod: 'monthly', isFree: true, features: ['100MB storage', 'Unlimited tasks', 'Collaborative docs'] },
        { name: 'Unlimited', price: 7, billingPeriod: 'monthly', features: ['Unlimited storage', 'Unlimited integrations', 'Dashboards', 'Gantt charts'] },
        { name: 'Business', price: 12, billingPeriod: 'monthly', features: ['Google SSO', 'Unlimited teams', 'Custom exporting', 'Advanced automations'] },
        { name: 'Enterprise', price: null, billingPeriod: 'custom', isEnterprise: true, features: ['White labeling', 'Enterprise API', 'Single Sign-On (SSO)', 'HIPAA compliance'] },
      ],
    },
    {
      competitorId: competitorIdMap['Asana'],
      currency: 'USD',
      plans: [
        { name: 'Personal', price: 0, billingPeriod: 'monthly', isFree: true, features: ['Unlimited tasks & projects', 'Unlimited messages', 'List, board & calendar views'] },
        { name: 'Starter', price: 10.99, billingPeriod: 'monthly', features: ['Timeline view', 'Asana Intelligence', 'Workflow builder', '250 automations/mo'] },
        { name: 'Advanced', price: 24.99, billingPeriod: 'monthly', features: ['Portfolios', 'Goals', 'Workload management', '25,000 automations/mo'] },
        { name: 'Enterprise', price: null, billingPeriod: 'custom', isEnterprise: true, features: ['SAML', 'SCIM', 'Custom branding', 'Data loss prevention export'] },
      ],
    },
  ];

  for (const p of pricingData) {
    if (p.competitorId) {
      await PricingSnapshot.findOneAndUpdate(
        { competitorId: p.competitorId },
        { $set: { ...p, capturedAt: new Date() } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`   ✔  Pricing snapshot recorded`);
    }
  }

  // ── Upsert weekly report ──────────────────────────────────────────────────
  console.log('\n📊  Seeding weekly report…');
  const weekStart = new Date('2026-09-07T00:00:00.000Z');
  const weekEnd = new Date('2026-09-13T23:59:59.999Z');

  await WeeklyReport.findOneAndUpdate(
    { weekStart },
    {
      $set: {
        weekStart,
        weekEnd,
        keyChanges: [
          'Notion rolled out tiered AI pricing add-ons at $10/user/month for Plus workspaces.',
          'Linear announced new triage rules and bi-directional Zendesk integration.',
          'ClickUp launched cross-tool unified connected search in open beta.',
          'Asana expanded Asana Intelligence capacity into standard Starter tiers.',
        ],
        strategicSignals: [
          'AI capabilities are moving from unmonetized experimental features into structured per-seat add-on SKUs.',
          'Workflow management platforms are converging around universal search and cross-platform unified workspaces.',
        ],
        recommendations: [
          'Position MarketLens as an all-inclusive alternative with no surprise seat-based AI add-on costs.',
          'Monitor SMB churn from competitors who recently adjusted entry-level freemium restrictions.',
        ],
        createdAt: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log(`   ✔  Weekly report for week of ${weekStart.toISOString().slice(0, 10)} recorded`);

  // ── Summary ───────────────────────────────────────────────────────────────
  const totalCompetitors = await Competitor.countDocuments();
  const totalSources = await Source.countDocuments();
  const totalPricing = await PricingSnapshot.countDocuments();
  const totalReports = await WeeklyReport.countDocuments();

  console.log('\n─────────────────────────────────────────────');
  console.log(`✅  Seed complete`);
  console.log(`   Competitors in DB       : ${totalCompetitors}`);
  console.log(`   Sources in DB           : ${totalSources}`);
  console.log(`   Pricing Snapshots in DB : ${totalPricing}`);
  console.log(`   Weekly Reports in DB    : ${totalReports}`);
  console.log('─────────────────────────────────────────────\n');

  await mongoose.disconnect();
  console.log('🔌  Disconnected from MongoDB.');
  process.exit(0);
};

seed().catch((err) => {
  console.error('\n❌  Seed failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
