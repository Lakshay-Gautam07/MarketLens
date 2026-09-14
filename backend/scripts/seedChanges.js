'use strict';

/**
 * seedChanges.js
 * Adds realistic changes and AI insights for Linear, ClickUp, and Asana if not already present.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const { Competitor, Source, Change, AIInsight } = require('../src/models');

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('🔌  Connected to MongoDB');

  const competitors = await Competitor.find().lean();
  const compMap = {};
  competitors.forEach((c) => { compMap[c.name] = c; });

  const sampleChanges = [
    {
      compName: 'Linear',
      sourceType: 'changelog',
      title: 'Linear announces Customer Triage and bidirectional Zendesk sync',
      category: 'product',
      significance: 'high',
      status: 'new',
      previousValue: 'Support integration limited to manual Zapier hooks and Slack tickets.',
      newValue: 'Native 2-way Zendesk, Intercom, and Freshdesk syncing with automatic SLA breach warnings.',
      description: "Linear's new Triage product stream directly bridges frontline support conversations with engineering backlog issues.",
      url: 'https://linear.app/changelog',
      insight: {
        summary: 'Linear is expanding downstream into support-engineering workflows. By creating native bidirectional syncing with Zendesk and Intercom, they remove the traditional silo between user-reported bugs and backlog prioritization.',
        strategicImpact: 'Threatens specialized feedback-loop tools and positions Linear as the single source of truth for both customer tickets and sprint items.',
        competitorAdvantage: 'Reduces context switching for engineering leads and increases software stickiness across customer support departments.',
        recommendedAction: 'Accelerate development of our bi-directional feedback integration and emphasize deep customer sentiment scoring that Linear does not yet offer.',
        affectedSegment: 'B2B SaaS Engineering Teams, Support Leads',
        confidence: 0.88,
      },
    },
    {
      compName: 'ClickUp',
      sourceType: 'blog',
      title: 'ClickUp launches Universal Connected Search in open beta',
      category: 'product',
      significance: 'high',
      status: 'new',
      previousValue: 'Internal search searched only ClickUp native lists and documents.',
      newValue: 'Unified search indexes Google Drive, Figma, GitHub, Slack, and Jira directly from global search bar.',
      description: 'ClickUp aims to solve application fragmentation by acting as a universal index across third-party enterprise tools.',
      url: 'https://clickup.com/blog',
      insight: {
        summary: 'ClickUp has introduced unified search across external SaaS repositories. This strategy mirrors enterprise knowledge search platforms like Glean and Raycast Pro.',
        strategicImpact: 'Aims to position ClickUp as the central operating system for company knowledge, defending against browser-based search extensions and specialized wiki hubs.',
        competitorAdvantage: 'Increases daily active user engagement (DAU/MAU) by incentivizing employees to keep ClickUp open as a universal launcher.',
        recommendedAction: 'Audit user telemetry to determine if unified external indexing is requested by our current enterprise cohort before committing engineering cycles.',
        affectedSegment: 'Enterprise Operations, Cross-functional Knowledge Workers',
        confidence: 0.84,
      },
    },
    {
      compName: 'Asana',
      sourceType: 'pricing',
      title: "Asana rebrands Business tier to 'Advanced' with included AI automations",
      category: 'pricing',
      significance: 'medium',
      status: 'reviewed',
      previousValue: 'Business plan at $24.99/user/mo with add-on AI trial token limits.',
      newValue: 'Advanced plan at $24.99/user/mo with 25,000 native AI smart workflow automations bundled.',
      description: 'Asana combines intelligence features directly into its upper-mid plan rather than charging an unbundled add-on fee.',
      url: 'https://asana.com/pricing',
    },
  ];

  for (const item of sampleChanges) {
    const comp = compMap[item.compName];
    if (!comp) continue;

    const source = await Source.findOne({ competitorId: comp._id, type: item.sourceType });
    if (!source) continue;

    const existing = await Change.findOne({ competitorId: comp._id, title: item.title });
    if (!existing) {
      const change = await Change.create({
        competitorId: comp._id,
        sourceId: source._id,
        title: item.title,
        description: item.description,
        url: item.url,
        category: item.category,
        previousValue: item.previousValue,
        newValue: item.newValue,
        significance: item.significance,
        status: item.status,
        detectedAt: new Date(Date.now() - Math.floor(Math.random() * 5 + 1) * 86400000),
      });
      console.log(`✔ Created Change: ${comp.name} - ${change.title}`);

      if (item.insight) {
        await AIInsight.create({
          changeId: change._id,
          ...item.insight,
          createdAt: new Date(),
        });
        console.log(`  ✔ Created AI Insight for Change`);
      }
    }
  }

  const totalChanges = await Change.countDocuments();
  const totalInsights = await AIInsight.countDocuments();
  console.log(`\nTotal Changes in DB: ${totalChanges}`);
  console.log(`Total AI Insights in DB: ${totalInsights}`);

  await mongoose.disconnect();
  console.log('🔌  Disconnected from MongoDB');
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
