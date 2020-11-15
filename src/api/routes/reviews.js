const express = require('express');
const router = express.Router({ mergeParams: true });

const reviewController = require('../controllers/reviewController')
let wrapper = fn => (...args) => fn(...args).catch(args[2]);

// get reviews for the book
router.get('/', wrapper(reviewController.review_for_a_book_get));

// create review
router.post('/', wrapper(reviewController.review_create_post));

// update own review
router.put('/:reviewid', wrapper(reviewController.review_update_post));

// upvote other's review
router.post('/:reviewid/upvote', wrapper(reviewController.review_upvote_post));

module.exports = router;
