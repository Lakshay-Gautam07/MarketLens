const { Router } = require('express');
const {
  getReports,
  getReportById,
  generateReport,
} = require('../controllers/reportController');

const router = Router();

router.get('/', getReports);
router.post('/generate', generateReport);
router.get('/:id', getReportById);

module.exports = router;
