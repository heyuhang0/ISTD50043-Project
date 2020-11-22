
const jwt = require('jsonwebtoken');
const Book = require('../models/book');
const db = require("../models/sequelizeIndex");
const review_errors = require('../helpers/Enums/review_error').review_error;
const common_errors = require('../helpers/Enums/common_errors').common_error;

const Review = db.review;
const User = db.user;

const authentication_secret = process.env.AUTHENTICATION_SECRET;
const asin_regex = require('../helpers/Constants/app_constant').app_constant.ASIN_REGEX;

/**
 * Get review for one book
 * @param {*} req params: asin; query: limit, offset, sort; headers: authorization
 * @param {*} res review list, user's review OR error type, error message
 */
exports.review_for_a_book_get = async function (req, res) {
    let bookASIN = req.params.asin;
    let limit = Number(req.query.limit) || 20;
    let offset = Number(req.query.offset) || 0;
    let token = req.headers.authorization;
    let userId;
    let user_review;
    let sort_statement;

    // sort option construction
    switch (req.query.sort) {
        case 'create_desc':
            sort_statement = ['createdAt', 'DESC'];
            break;
        case 'create_asc':
            sort_statement = ['createdAt', 'ASC'];
            break;
        case 'helpful_desc':
            sort_statement = ['helpful', 'DESC'];
            break;
        case 'helpful_asc':
            sort_statement = ['helpful', 'ASC'];
            break;
        case 'rating_desc':
            sort_statement = ['rating', 'DESC'];
            break;
        case 'rating_asc':
            sort_statement = ['rating', 'ASC'];
            break;
        default:
            sort_statement = ['helpful', 'DESC'];
            break;
    }

    console.log('Getting reviews',
        'for book ASIN=' + bookASIN,
        'with limit=' + limit,
        'and offset=' + offset,
        'sort by=' + sort_statement);

    // check valid asin and asin exists in db
    if (!asin_regex.test(bookASIN) || !await Book.findOne({ asin: bookASIN })) {
        res.status(400).send(common_errors.EXCEED_LIMIT);
        return;
    }

    // each page > 100 records, or total > 1000 record
    if (limit > 100 || offset + limit > 1000) {
        res.status(400).send(common_errors.EXCEED_MAX_SEARCH);
        return;
    };

    // invalid token
    if (token && !token.startsWith("Bearer ")) {
        res.status(401).send(common_errors.AUTHENTICATION_ERROR);
        return;
    }

    // find user's review if exists.
    if (token) {
        token = token.substring(7, token.length);
        try {
            this_user = jwt.verify(token, authentication_secret);
            userId = this_user.user;
            email = this_user.email;
            name = this_user.name
        } catch (err) {
            res.status(401).send(common_errors.AUTHENTICATION_ERROR);
            return;
        }
        // find user's review
        user_review = await Review.findOne({
            where: {
                reviewerId: userId,
                asin: bookASIN
            },
            include: [{
                model: User,
                attributes: ['name', 'email'],
                required: true
            }]
        });
    };

    // find reviews
    let reviews = await Review.findAll({
        where: { asin: bookASIN },
        include: [{
            model: User,
            attributes: ['name', 'email'],
            required: true
        }],
        order: [sort_statement],
        limit: limit,
        offset: offset,
        subQuery: false,
    });
    res.send({
        success: 1,
        reviews: reviews,
        user_review: user_review
    })
};

/**
 * Create a review
 * @param {*} req params: asin; headers: authorization;
 * body: raitng, summary, reviewText;
 * @param {*} res success, review details, user info; OR error type, error message;
 */
exports.review_create_post = async function (req, res) {
    let bookASIN = req.params.asin;
    let token = req.headers.authorization;
    let rating = Number(req.body.rating);
    let summary = req.body.summary;
    let review_text = req.body.reviewText;
    let userId;

    if (!bookASIN || !rating || !summary || !review_text) {
        res.status(400).send(common_errors.MISSING_REQUIRED_PARAMS);
        return;
    }

    // invalid token
    if (!token || !token.startsWith("Bearer ")) {
        res.status(401).send(common_errors.AUTHENTICATION_ERROR);
        return;
    }

    // find user's id
    token = token.substring(7, token.length);
    try {
        this_user = jwt.verify(token, authentication_secret);
        userId = this_user.user;
        email = this_user.email;
        name = this_user.name
    } catch (err) {
        res.status(401).send(common_errors.AUTHENTICATION_ERROR);
        return;
    }

    let book_to_be_review = await Book.findOne({ asin: bookASIN });
    // check valid asin and asin exists in db
    if (!asin_regex.test(bookASIN) || !book_to_be_review) {
        res.status(400).send(review_errors.BOOK_ASIN_NOT_EXIST_OR_INVALID);
        return;
    }

    // Create a new Reivew
    let review = {
        asin: bookASIN,
        summary: summary,
        reviewerId: userId,
        reviewText: review_text,
        rating: rating
    };

    // Save Review in the database
    console.log(
        'Posting review for book ASIN=' + bookASIN,
        'userId=' + userId,
        'with rating=' + rating,
        'and summary=' + summary,
        'and text=' + review_text);
    let saved_review = await Review.create(
        review,
        {
            include: [{
                model: User,
                attributes: ['name', 'email'],
                required: true
            }]
        });
    let new_average_rating = (book_to_be_review.rating_total + rating) / (book_to_be_review.review_number + 1);
    let updated_book = await Book.findOneAndUpdate(
        {
            asin: bookASIN
        },
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
        review: saved_review,
        user: {
            userId: userId,
            name: name,
            email: email
        }
    });
};


/**
 * Update the revie
 * @param {*} req params: asin, reviewid; headers: authorization;
 * body: rating, summary, text;
 * @param {*} res success, review details; OR error type, error message
 */
exports.review_update_post = async function (req, res) {
    let reviewId = req.params.reviewid;
    let bookASIN = req.params.asin;
    let token = req.headers.authorization;
    let rating = Number(req.body.rating);
    let summary = req.body.summary;
    let review_text = req.body.reviewText;

    if (!bookASIN || !reviewId || !rating || !summary || !review_text) {
        res.status(400).send(common_errors.MISSING_REQUIRED_PARAMS);
        return;
    };

    // TODO: delete comment after frontend is ready
    // *** COMMENT OUT THIS PART FOR EASIER DEVELEPMENT ***
    if (!token || !token.startsWith("Bearer ")) {
        res.status(401).send(common_errors.AUTHENTICATION_ERROR);
        return;
    };

    token = token.substring(7, token.length);
    try {
        this_user = jwt.verify(token, authentication_secret);
        userId = this_user.user;
        email = this_user.email;
        name = this_user.name
    } catch (err) {
        res.status(401).send(common_errors.AUTHENTICATION_ERROR);
        return;
    };

    // *** TILL HERE ***

    let book_to_be_review = await Book.findOne({ asin: bookASIN });
    // check valid asin and asin exists in db
    if (!asin_regex.test(bookASIN) || !book_to_be_review) {
        res.status(400).send(review_errors.BOOK_ASIN_NOT_EXIST_OR_INVALID);
        return;
    };

    let old_review = await Review.findOne({
        where: { reviewId: reviewId },
        include: [{
            model: User,
            attributes: ['name', 'email'],
            required: true
        }]
    });
    if (!old_review) {
        res.status(400).send(review_errors.REVIEWID_NOT_EXIST);
    };

    // update book review info
    console.log(
        'Updating review with reviewId=' + reviewId,
        'for book ASIN=' + bookASIN,
        'userId=' + userId,
        'with rating=' + rating,
        'and summary=' + summary,
        'and text=' + review_text);
    let updated_book = await Book.findOneAndUpdate(
        {
            asin: bookASIN
        },
        {
            $inc: {
                rating_total: rating - old_review.rating
            },
            $set: {
                rating_average: (book_to_be_review.rating_total + rating - old_review.rating) / book_to_be_review.review_number
            }
        },
        { new: true }
    );

    // update review itself
    old_review.summary = summary;
    old_review.reviewText = review_text;
    old_review.rating = rating;
    await old_review.save();
    res.send({
        success: 1,
        updated_book: updated_book,
        updated_review: old_review
    });
};

/**
 * Upvote a review
 * @param {*} req params: reviewId
 * @param {*} res success, review details; OR error type, error message
 */
exports.review_upvote_post = async function (req, res) {
    // *** 983033 CAN BE A DUMMY REVIEW ID ***
    // TODO: delete dummy reviewid after frontend is ready
    let reviewId = req.params.reviewid || 983033;
    console.log('Upvoting review with reviewId=' + reviewId);

    let review = await Review.findOne({ where: { reviewId: reviewId } });
    if (!review) {
        res.status(400).send(review_errors.REVIEWID_NOT_EXIST);
    };

    let review_update_query = {
        helpful: db.Sequelize.literal('helpful + 1')
    };
    await Review.update(
        review_update_query,
        {
            where: { reviewId: reviewId },
        }
    );
    let updated_review = await Review.findOne({ where: { reviewId: reviewId } });
    res.send({
        success: 1,
        updated_review: updated_review
    });
};
