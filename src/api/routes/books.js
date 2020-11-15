var express = require('express');
var reviewsRouter = require('./reviews');

var router = express.Router();

// Require controller modules.
var book_controller = require('../controllers/bookController');
let wrapper = fn => (...args) => fn(...args).catch(args[2]);

//TODO: to delete test function
router.get('/testing', wrapper(book_controller.book_find_by_price));

// search book
router.get('/', wrapper(book_controller.book_search_get));

// create book
router.post('/', wrapper(book_controller.book_create_post));

// trending books
router.get('/trending', wrapper(book_controller.book_trending_get));

// hot books
router.get('/hot', wrapper(book_controller.book_hot_get));

// book details
router.get('/:asin', wrapper(book_controller.book_details_get));

// book reviews
router.use('/:asin/reviews', reviewsRouter);

module.exports = router;
