'use strict';

const { Router } = require('express');
const healthRouter      = require('./health');
const analysisRouter    = require('./analysis');
const competitorsRouter = require('./competitors');
const changesRouter     = require('./changes');
const insightsRouter    = require('./insights');
const pricingRouter     = require('./pricing');
const reportsRouter     = require('./reports');

const router = Router();

// ── Route groups ──────────────────────────────────────────────────────────────
router.use('/health',      healthRouter);
router.use('/analysis',    analysisRouter);
router.use('/competitors', competitorsRouter);
router.use('/changes',     changesRouter);
router.use('/insights',    insightsRouter);
router.use('/pricing',     pricingRouter);
router.use('/reports',     reportsRouter);

module.exports = router;
