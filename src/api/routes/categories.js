const express = require('express');
const router = express.Router();

const categoryController = require('../controllers/categoryController');
const bookController = require('../controllers/bookController');
let wrapper = fn => (...args) => fn(...args).catch(args[2]);

// get all categories
router.get('/', wrapper(categoryController.all_categories_get));

// get suggested categories
router.get('/suggested', wrapper(categoryController.suggested_categories_get));

// get suggested categories
router.get('/:category', bookController.book_category_get);

module.exports = router;
