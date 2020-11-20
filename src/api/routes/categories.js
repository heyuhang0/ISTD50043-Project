var express = require('express');
var router = express.Router();

var categoryController = require('../controllers/categoryController');
var bookCantroller = require('../controllers/bookController');
let wrapper = fn => (...args) => fn(...args).catch(args[2]);

// get all categories
router.get('/tree', wrapper(categoryController.all_categories_get));

// get suggested categories
router.get('/suggested', wrapper(categoryController.suggested_categories_get));

// get suggested categories
router.get('/:category', bookCantroller.book_category_get);

module.exports = router;
