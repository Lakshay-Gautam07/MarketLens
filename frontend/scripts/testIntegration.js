import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

const runIntegrationTests = async () => {
  console.log('🧪  Testing Frontend-Backend API Integration...\n');

  let passed = 0;
  let failed = 0;

  const test = async (name, fn) => {
    try {
      await fn();
      console.log(`  ✅  ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌  ${name}: ${err.message}`);
      failed++;
    }
  };

  let competitorId;

  // 1. Health
  await test('GET /api/health (System status)', async () => {
    const res = await axios.get(`${BASE_URL}/health`);
    if (res.data.status !== 'ok') throw new Error('Expected status ok');
  });

  // 2. Competitors
  await test('GET /api/competitors (Overview & Landscape)', async () => {
    const res = await axios.get(`${BASE_URL}/competitors`);
    if (!Array.isArray(res.data.data) || res.data.data.length === 0) {
      throw new Error('Expected competitors array');
    }
    competitorId = res.data.data[0]._id;
    console.log(`      Found ${res.data.data.length} competitors (${res.data.data.map(c => c.name).join(', ')})`);
  });

  // 3. Competitor Detail
  await test('GET /api/competitors/:id (Competitor detail with sources)', async () => {
    const res = await axios.get(`${BASE_URL}/competitors/${competitorId}`);
    if (!res.data.data._id || !Array.isArray(res.data.data.sources)) {
      throw new Error('Expected competitor data with sources array');
    }
    console.log(`      ${res.data.data.name} has ${res.data.data.sources.length} monitored sources`);
  });

  // 4. Changes
  await test('GET /api/changes (Changes feed with filters)', async () => {
    const res = await axios.get(`${BASE_URL}/changes?limit=10`);
    if (!Array.isArray(res.data.data) || res.data.data.length === 0) {
      throw new Error('Expected changes array');
    }
    console.log(`      Found ${res.data.data.length} changes logged in MongoDB`);
  });

  // 5. Pricing
  await test('GET /api/pricing/:competitorId (Pricing Intelligence)', async () => {
    const res = await axios.get(`${BASE_URL}/pricing/${competitorId}`);
    if (!res.data.data.competitor || !res.data.data.latest) {
      throw new Error('Expected pricing snapshot');
    }
    console.log(`      ${res.data.data.competitor.name} has ${res.data.data.latest.plans?.length} plans`);
  });

  // 6. Strategic Signals (AI Insights)
  await test('GET /api/insights (Strategic Signals)', async () => {
    const res = await axios.get(`${BASE_URL}/insights`);
    if (!Array.isArray(res.data.data) || res.data.data.length === 0) {
      throw new Error('Expected AI insights array');
    }
    console.log(`      Found ${res.data.data.length} Gemini strategic insights in MongoDB`);
  });

  // 7. Weekly Reports
  await test('GET /api/reports (Weekly Reports)', async () => {
    const res = await axios.get(`${BASE_URL}/reports`);
    if (!Array.isArray(res.data.data) || res.data.data.length === 0) {
      throw new Error('Expected weekly reports array');
    }
    console.log(`      Found ${res.data.data.length} weekly report(s)`);
  });

  console.log(`\n───────────────────────────────────────────────────`);
  console.log(`Integration Test Result: ${passed} passed, ${failed} failed.`);
  console.log(`───────────────────────────────────────────────────\n`);

  if (failed > 0) process.exit(1);
};

runIntegrationTests().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
