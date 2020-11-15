var express = require('express');
var router = express.Router();

var categoryController = require('../controllers/categoryController');
var bookCantroller = require('../controllers/bookController');

// get all categories
router.get('/', categoryController.all_categories_get);

// get suggested categories
router.get('/suggested', categoryController.suggested_categories_get);

// get suggested categories
router.get('/:category', bookCantroller.book_category_get);

module.exports = router;
