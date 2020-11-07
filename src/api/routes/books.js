var express = require('express');
var reviewsRouter = require('./reviews');

var router = express.Router();

// Require controller modules.
var book_controller = require('../controllers/bookController');

//TODO: to delete test function
router.get('/testing', book_controller.book_find_by_price);

// search book
router.get('/', book_controller.book_search_get);

// create book
router.post('/', book_controller.book_create_post);

// trending books
router.get('/trending', book_controller.book_trending_get);

// recent books
router.get('/recent', book_controller.book_recent_get);

// book details
router.get('/:asin', book_controller.book_details_get);

// book reviews
router.use('/:asin/reviews', reviewsRouter);

module.exports = router;
