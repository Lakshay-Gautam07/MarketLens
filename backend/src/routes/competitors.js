'use strict';

const { Router } = require('express');
const {
  getCompetitors,
  getCompetitorById,
} = require('../controllers/competitorController');

const router = Router();

router.get('/', getCompetitors);
router.get('/:id', getCompetitorById);

module.exports = router;
