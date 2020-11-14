var express = require('express');
var router = express.Router({ mergeParams: true });

var reviewController = require('../controllers/reviewController')

// get reviews for the book
router.get('/', reviewController.review_for_a_book_get);

// create review
router.post('/', reviewController.review_create_post);

// update own review
router.put('/:reviewid', reviewController.review_update_post);

// upvote other's review
router.post('/:reviewid/upvote', reviewController.review_upvote_post);

module.exports = router;
