'use strict';

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

const runTests = async () => {
  console.log('🧪  Starting REST API endpoint test suite...\n');

  let passed = 0;
  let failed = 0;

  const test = async (name, fn) => {
    try {
      await fn();
      console.log(`  ✅  ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌  ${name}: ${err.message}`);
      if (err.response) {
        console.error(`      Status: ${err.response.status}`, err.response.data);
      }
      failed++;
    }
  };

  let competitorId;
  let changeId;
  let insightChangeId;
  let reportId;

  // ── 1. Competitors ──────────────────────────────────────────────────────────
  console.log('── [1/5] Competitors ───────────────────────────');
  await test('GET /api/competitors (list & pagination)', async () => {
    const res = await axios.get(`${BASE_URL}/competitors`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!Array.isArray(res.data.data) || res.data.data.length === 0) {
      throw new Error('Expected non-empty data array');
    }
    if (!res.data.pagination || res.data.pagination.total < 1) {
      throw new Error('Expected pagination object');
    }
    competitorId = res.data.data[0]._id;
  });

  await test('GET /api/competitors/:id (with sources)', async () => {
    const res = await axios.get(`${BASE_URL}/competitors/${competitorId}`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.data.data._id || !Array.isArray(res.data.data.sources)) {
      throw new Error('Expected competitor with sources array');
    }
  });

  // ── 2. Changes ──────────────────────────────────────────────────────────────
  console.log('\n── [2/5] Changes ───────────────────────────────');
  await test('GET /api/changes (list & pagination)', async () => {
    const res = await axios.get(`${BASE_URL}/changes`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!Array.isArray(res.data.data)) throw new Error('Expected data array');
    if (!res.data.pagination) throw new Error('Expected pagination');
    if (res.data.data.length > 0) {
      changeId = res.data.data[0]._id;
    }
  });

  await test('GET /api/changes (filter by category=pricing)', async () => {
    const res = await axios.get(`${BASE_URL}/changes?category=pricing`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    for (const c of res.data.data) {
      if (c.category !== 'pricing') throw new Error(`Expected category pricing, got ${c.category}`);
    }
  });

  await test('GET /api/changes (filter by significance=high)', async () => {
    const res = await axios.get(`${BASE_URL}/changes?significance=high`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    for (const c of res.data.data) {
      if (c.significance !== 'high') throw new Error(`Expected significance high, got ${c.significance}`);
    }
  });

  await test('GET /api/changes (filter by competitor=Notion)', async () => {
    const res = await axios.get(`${BASE_URL}/changes?competitor=Notion`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    for (const c of res.data.data) {
      if (c.competitorId?.name !== 'Notion') throw new Error(`Expected Notion competitor`);
    }
  });

  await test('GET /api/changes (filter by date range)', async () => {
    const res = await axios.get(`${BASE_URL}/changes?from=2026-01-01&to=2026-12-31`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  if (changeId) {
    await test('GET /api/changes/:id (detail & populated refs)', async () => {
      const res = await axios.get(`${BASE_URL}/changes/${changeId}`);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (!res.data.data._id || !res.data.data.competitorId) {
        throw new Error('Expected populated change');
      }
    });
  }

  // ── 3. AI Insights ──────────────────────────────────────────────────────────
  console.log('\n── [3/5] AI Insights ───────────────────────────');
  await test('GET /api/insights (list & pagination)', async () => {
    const res = await axios.get(`${BASE_URL}/insights`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!Array.isArray(res.data.data)) throw new Error('Expected data array');
    if (res.data.data.length > 0) {
      insightChangeId = res.data.data[0].changeId?._id || res.data.data[0].changeId;
    }
  });

  if (insightChangeId) {
    await test('GET /api/insights/:changeId (retrieve insight)', async () => {
      const res = await axios.get(`${BASE_URL}/insights/${insightChangeId}`);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (!res.data.data.summary || !res.data.data.strategicImpact) {
        throw new Error('Expected insight summary and strategicImpact');
      }
    });
  }

  // ── 4. Pricing ──────────────────────────────────────────────────────────────
  console.log('\n── [4/5] Pricing ───────────────────────────────');
  await test('GET /api/pricing (list snapshots & pagination)', async () => {
    const res = await axios.get(`${BASE_URL}/pricing`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!Array.isArray(res.data.data) || res.data.data.length === 0) {
      throw new Error('Expected pricing snapshots');
    }
  });

  await test('GET /api/pricing/:competitorId (snapshots for competitor)', async () => {
    const res = await axios.get(`${BASE_URL}/pricing/${competitorId}`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.data.data.competitor || !res.data.data.latest) {
      throw new Error('Expected competitor and latest pricing snapshot');
    }
    if (!Array.isArray(res.data.data.latest.plans)) {
      throw new Error('Expected plans array in snapshot');
    }
  });

  // ── 5. Reports ──────────────────────────────────────────────────────────────
  console.log('\n── [5/5] Reports ───────────────────────────────');
  await test('GET /api/reports (list reports & pagination)', async () => {
    const res = await axios.get(`${BASE_URL}/reports`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!Array.isArray(res.data.data) || res.data.data.length === 0) {
      throw new Error('Expected weekly reports');
    }
    reportId = res.data.data[0]._id;
  });

  if (reportId) {
    await test('GET /api/reports/:id (report detail)', async () => {
      const res = await axios.get(`${BASE_URL}/reports/${reportId}`);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (!Array.isArray(res.data.data.keyChanges)) {
        throw new Error('Expected keyChanges array in report');
      }
    });
  }

  // ── Error Handling Tests ────────────────────────────────────────────────────
  console.log('\n── Error Handling ──────────────────────────────');
  await test('Invalid ObjectId returns 400', async () => {
    try {
      await axios.get(`${BASE_URL}/competitors/invalid-id`);
      throw new Error('Should have thrown 400');
    } catch (err) {
      if (err.response?.status !== 400) throw err;
    }
  });

  await test('Non-existent ObjectId returns 404', async () => {
    try {
      await axios.get(`${BASE_URL}/competitors/000000000000000000000000`);
      throw new Error('Should have thrown 404');
    } catch (err) {
      if (err.response?.status !== 404) throw err;
    }
  });

  console.log(`\n─────────────────────────────────────────────────`);
  console.log(`Summary: ${passed} passed, ${failed} failed.`);
  console.log(`─────────────────────────────────────────────────\n`);

  if (failed > 0) {
    process.exit(1);
  }
};

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
