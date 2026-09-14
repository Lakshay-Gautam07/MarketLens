'use strict';

const { Router } = require('express');
const {
  analyseChangeHandler,
  getInsightHandler,
  listChangesHandler,
} = require('../controllers/analysisController');

const router = Router();

/**
 * GET  /api/analysis/changes          → list changes (unanalysed by default)
 * GET  /api/analysis/changes/:changeId → retrieve existing insight
 * POST /api/analysis/changes/:changeId → trigger AI analysis (idempotent)
 */
router.get('/changes',             listChangesHandler);
router.get('/changes/:changeId',   getInsightHandler);
router.post('/changes/:changeId',  analyseChangeHandler);

module.exports = router;
