const express = require('express');
const reviewsRouter = require('./reviews');

const router = express.Router();

// Require controller modules.
const book_controller = require('../controllers/bookController');
let wrapper = fn => (...args) => fn(...args).catch(args[2]);

// search book
router.get('/search', book_controller.book_search_get);

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
