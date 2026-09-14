'use strict';

const { Router } = require('express');
const {
  getChanges,
  getChangeById,
} = require('../controllers/changeController');

const router = Router();

router.get('/', getChanges);
router.get('/:id', getChangeById);

module.exports = router;
