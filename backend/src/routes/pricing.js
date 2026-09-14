'use strict';

const { Router } = require('express');
const {
  getPricing,
  getPricingByCompetitor,
} = require('../controllers/pricingController');

const router = Router();

router.get('/', getPricing);
router.get('/:competitorId', getPricingByCompetitor);

module.exports = router;
