
mockdata = require('../helpers/mockdata');
const db = require("../model/reviews");
const Review = db.review;
const Op = db.Sequelize.Op;

var mockReviews = mockdata.mockReview;


// get review for one book
exports.review_for_a_book_get = function (req, res, next) {
    let bookASIN = req.params.asin;
    let limit = req.query.limit || 20;
    let offset = req.query.offset || 0;

    Review.findAll({ where: { asin: bookASIN } }).then(data => { res.send(data); }).catch(err => {
        res.status(500).send({
            message:
                err.message || "Some error occurred while retrieving reviews."
        });
    });

    console.log('Getting reviews',
        'for book ASIN=' + bookASIN,
        'with limit=' + limit,
        'and offset=' + offset);
    res.json({
        review: mockReviews, user_review_id: null
    });
};

// Handle review create on POST.
exports.review_create_post = function (req, res) {
    let bookASIN = req.query.asin;

    // Create a new Reivew
    const review = {
        asin: bookASIN,
        summary: req.body.summary,
        reviewerId: 1, // todo reviewerid to be added
        reviewText: req.body.reviewText,
        rating: req.body.rating
    };

    // Save Review in the database
    console.log('Posting review for book ASIN=' + bookASIN);
    Review
        .create(review)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Some error occurred while creating the Review."
            });
        });
};


// Handle review update on POST.
exports.review_update_post = function (req, res) {
    let reviewId = req.params.reviewid;

    const review = {
        summary: req.body.summary,
        reviewText: req.body.reviewText,
        rating: req.body.rating
    }
    Review.update(req.body, {
        where: { reviewId: reviewId }
    }).then(num => {
        if (num == 1) {
            res.send({
                message: "Reviews was updated successfully."
            });
        } else {
            res.send({
                message: `Cannot update Review with id=${reviewId}. Maybe Review was not found or req.body is empty!`
            });
        }
    })
        .catch(err => {
            res.status(500).send({
                message: "Error updating Review with id=" + reviewId
            });
        });
};

// Handle upvote review on POST.
exports.review_upvote_post = function (req, res) {
    let reviewId = req.params.reviewid;

    const review = {
        helpful: db.Sequelize.literal('helpful + 1')
    }

    Review.update(review, {
        where: { reviewId: reviewId }
    }).then(num => {
        if (num == 1) {
            res.send({
                message: "Reviews was updated successfully."
            });
        } else {
            res.send({
                message: `Cannot update Review with id=${reviewId}. Maybe Review was not found or req.body is empty!`
            });
        }
    })
        .catch(err => {
            console.log(err);
            res.status(500).send({
                message: "Error updating Review with id=" + reviewId
            });
        });
    console.log('upvoting review ' + reviewId);
};
