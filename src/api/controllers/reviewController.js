
mockdata = require('../helpers/mockdata');
const jwt = require('jsonwebtoken');
const Book = require('../models/book');
const db = require("../models/sequelizeIndex");
const Review = db.review;
const Op = db.Sequelize.Op;
const authentication_secret = process.env.AUTHENTICATION_SECRET;
const mock_user_review = mockdata.mockUserReview;

// get review for one book
exports.review_for_a_book_get = async function (req, res, next) {
    let bookASIN = req.params.asin;
    let limit = Number(req.query.limit) || 20;
    let offset = Number(req.query.offset) || 0;

    Review.findAll({ where: { asin: bookASIN } })
    .then(data => 
        { res.send({
            success:1,
            reviews: data,
            user_review: mock_user_review
        }); 
    }).catch(err => {
        res.status(500).send({
            success: 0,
            error_type: 0,
            error_message: err.message || "Some error occurred while retrieving reviews."
        });
    });

    console.log('Getting reviews',
        'for book ASIN=' + bookASIN,
        'with limit=' + limit,
        'and offset=' + offset);
};

// Handle review create on POST.
exports.review_create_post = async function (req, res) {
    let bookASIN = req.params.asin;
    let token = req.headers.authorization;
    let rating = Number(req.body.rating);
    let summary = req.body.summary;
    let review_text = req.body.reviewText;
    let userId = 131072;

    if (!bookASIN || !rating || !summary || !review_text) {
        res.status(400).send({
            success: 0,
            error_type: 0,
            error_message: "Missing required fields."
        });
        return;
    }

    // *** COMMENT OUT THIS PART FOR EASIER DEVELEPMENT ***
    if (!token || !token.startsWith("Bearer ")) {
        res.status(401).send({
            success: 0,
            error_type: 1,
            error_message: "failed to authenticate user."
        });
        return;
    }

    token = token.substring(7, token.length);
    try {
        userId = jwt.verify(token, authentication_secret).user;
    } catch (err) {
        res.status(401).send({
            success: 0,
            error_type: 1,
            error_message: "failed to authenticate user."
        });
        return;
    }
    // *** TILL HERE *** //


    // Create a new Reivew
    let review = {
        asin: bookASIN,
        summary: summary,
        reviewerId: userId,
        reviewText: review_text,
        rating: rating
    };

    // Save Review in the database
    console.log('Posting review for book ASIN=' + bookASIN);
    try{
        let saved_review = await Review.create(review)
    let book_reviewed = await Book.findOne({ asin: bookASIN });
    let new_average_rating = (book_reviewed.rating_total + rating) / (book_reviewed.review_number + 1);
    let updated_book = await Book.findOneAndUpdate(
        { asin: bookASIN },
        {
            $inc: {
                review_number: 1,
                rating_total: rating
            },
            $set: {
                rating_average: new_average_rating
            }
        },
        { new: true }
    );
    res.json({ 
        success: 1, 
        book: updated_book, 
        review: saved_review });
    }catch(err){
        console.log(err);
        res.status(500).send({
            success: 0,
            error_type: 2,
            error_message: "failed to create new review."
        });
        return;
    }
};


// Handle review update on POST.
exports.review_update_post = function (req, res) {
    let reviewId = req.params.reviewid;
    let bookASIN = req.params.asin;
    let token = req.headers.authorization;
    let rating = Number(req.body.rating);
    let summary = req.body.summary;
    let review_text = req.body.reviewText;
    let userId = 131072;
    
    if (!bookASIN || !rating || !summary || !review_text) {
        res.status(400).send({
            success: 0,
            error_type: 0,
            error_message: "Missing required fields."
        });
        return;
    }

    // *** COMMENT OUT THIS PART FOR EASIER DEVELEPMENT ***
    if (!token || !token.startsWith("Bearer ")) {
        res.status(401).send({
            success: 0,
            error_type: 1,
            error_message: "failed to authenticate user."
        });
        return;
    }

    token = token.substring(7, token.length);
    try {
        userId = jwt.verify(token, authentication_secret).user;
    } catch (err) {
        res.status(401).send({
            success: 0,
            error_type: 1,
            error_message: "failed to authenticate user."
        });
        return;
    }

    // *** TILL HERE ***

    const review = {
        summary: summary,
        reviewText: review_text,
        rating: rating
    }
    Review.update(req.body, {
        where: { reviewId: reviewId }
    }).then(num => {
        if (num == 1) {
            res.send({
                success: 1,
                updated_review: mock_user_review,
            });
        } else {
            res.status(500).send({
                success: 0,
                error_type: 1,
                error_message: `Cannot update Review with id=${reviewId}. Maybe Review was not found or req.body is empty!`
            });
        }
    })
        .catch(err => {
            res.status(500).send({
                success: 0,
                error_type: 1,
                error_message: "Error updating Review with id=" + reviewId
            });
        });
};

// Handle upvote review on POST.
exports.review_upvote_post = function (req, res) {
    // *** 983033 CAN BE A DUMMY REVIEW ID ***
    let reviewId = req.params.reviewid || 983033;

    let review = {
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
