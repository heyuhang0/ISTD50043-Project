var express = require('express');
var router = express.Router();

var categoryController = require('../controllers/categoryController');

// get all categories
router.get('/tree', categoryController.all_categories_get);

// get suggested categories
router.get('/suggested', categoryController.suggested_categories_get);

module.exports = router;
