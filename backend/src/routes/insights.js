'use strict';

const { Router } = require('express');
const {
  getInsights,
  getInsightByChangeId,
} = require('../controllers/insightController');

const router = Router();

router.get('/', getInsights);
router.get('/:changeId', getInsightByChangeId);

module.exports = router;
