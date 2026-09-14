'use strict';

const { Router } = require('express');
const {
  getReports,
  getReportById,
} = require('../controllers/reportController');

const router = Router();

router.get('/', getReports);
router.get('/:id', getReportById);

module.exports = router;
