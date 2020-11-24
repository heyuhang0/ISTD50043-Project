
const jwt = require('jsonwebtoken');
const db = require("../models/sequelizeIndex");
const Review = db.review;
const User = db.user;
const Book = require('../models/book');

const review_errors = require('../helpers/Enums/review_error').review_error;
const common_errors = require('../helpers/Enums/common_errors').common_error;
const review_sort_keyword = require('../helpers/Enums/review_sort').review_sort_keyword;
const review_sort_statement = require('../helpers/Enums/review_sort').review_sort_statement;

const authentication_secret = process.env.AUTHENTICATION_SECRET;
const asin_regex = require('../helpers/Constants/app_constant').app_constant.ASIN_REGEX;

/**
 * Get review for one book
 * @param {*} req 
 * params: asin(string, required); 
 * headers: authorization(string, not required)
 * query: limit(number, optional, default 20), 
 *        offset(number, optianl, default 0), 
 *        sort(string, optional, enum string in review_sort_keyword, not required); 
 * @param {*} res 
 * {
        success: 1,
        reviews: arrays of objects(book list),
        user_review: object (default null)
    }
    OR
    {success: 0, err_type: Number, err_msg: String} (Enum in common_error or review_error)
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
    let sort_key = Object.keys(review_sort_keyword).find(key => review_sort_keyword[key] === req.query.sort);
    if (sort_key) {
        sort_statement = review_sort_statement[sort_key];
    } else {
        sort_statement = review_sort_statement.HELPFUL_DESC;
    };

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

    // > 100 per page
    if (limit > 100) {
        res.status(400).send(common_errors.EXCEED_LIMIT);
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
            userId = this_user.userId;
            email = this_user.email;
            name = this_user.name
        } catch (err) {
            res.status(401).send(common_errors.AUTHENTICATION_ERROR);
            return;
        }
        // find user's review
        if (userId) {
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
    };


    // total > 1000 record
    if (offset + limit > 1000) {
        res.json({
            success: 1,
            reviews: [],
            user_review: user_review
        });
        return;
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
    });
    return;
};

/**
 * Create a review
 * @param {*} req 
 * params: asin(string, requried); 
 * headers: authorization(string, required);
 * body: raitng(Number, required), 
 *       summary(string, required), 
 *       reviewText(string, required);
 * @param {*} res 
   {
        success: 1,
        book: object(book),
        review: object(review),
        user: {
            userId: Number,
            name: String,
            email: Email
        }
    }
 * OR
 * {success: 0, err_type: Number, err_msg: String} (Enum in common_error or review_error)
 */
exports.review_create_post = async function (req, res) {
    let bookASIN = req.params.asin;
    let token = req.headers.authorization;
    let rating = Number(req.body.rating);
    let summary = req.body.summary;
    let review_text = req.body.reviewText;
    let userId;

    // required feilds
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
        userId = this_user.userId;
        email = this_user.email;
        name = this_user.name;
    } catch (err) {
        res.status(401).send(common_errors.AUTHENTICATION_ERROR);
        return;
    }

    // check valid asin and asin exists in db
    let book_to_be_review = await Book.findOne({ asin: bookASIN });
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

    // update rating information in book table
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
    return;
};


/**
 * Update the revie
 * @param {*} req 
 * params: asin(string, required), 
 *         reviewid(number, required); 
 * headers: authorization(string, required);
 * body: rating(number, required), 
 *       summary(string, required), 
 *       reviewText(string, required);
 * @param {*} res
 * {
        success: 1,
        updated_book: object(updated book),
        updated_review: object(updated review)
    }
    OR
    {success: 0, err_type: Number, err_msg: String} (Enum in common_error or review_error)
 */
exports.review_update_post = async function (req, res) {
    let reviewId = req.params.reviewid;
    let bookASIN = req.params.asin;
    let token = req.headers.authorization;
    let rating = Number(req.body.rating);
    let summary = req.body.summary;
    let review_text = req.body.reviewText;

    // required feilds
    if (!bookASIN || !reviewId || !rating || !summary || !review_text) {
        res.status(400).send(common_errors.MISSING_REQUIRED_PARAMS);
        return;
    };

    // check user is logged in
    if (!token || !token.startsWith("Bearer ")) {
        res.status(401).send(common_errors.AUTHENTICATION_ERROR);
        return;
    };

    // check user is logged in
    token = token.substring(7, token.length);
    try {
        this_user = jwt.verify(token, authentication_secret);
        userId = this_user.userId;
        email = this_user.email;
        name = this_user.name
    } catch (err) {
        res.status(401).send(common_errors.AUTHENTICATION_ERROR);
        return;
    };

    // check valid asin and asin exists in db
    let book_to_be_review = await Book.findOne({ asin: bookASIN });
    if (!asin_regex.test(bookASIN) || !book_to_be_review) {
        res.status(400).send(review_errors.BOOK_ASIN_NOT_EXIST_OR_INVALID);
        return;
    };

    // check review is is correct
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
        return;
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
    return;
};

/**
 * Upvote a review
 * @param {*} req params: reviewId(Number, required)
 * @param {*} res 
 * {
        success: 1,
        updated_review: object(updated review)
    }
 * OR
 * {success: 0, err_type: Number, err_msg: String} (Enum in common_error or review_error)
 */
exports.review_upvote_post = async function (req, res) {
    // reviewId
    let reviewId = req.params.reviewid;
    console.log('Upvoting review with reviewId=' + reviewId);

    // check review id is correct
    let review = await Review.findOne({ where: { reviewId: reviewId } });
    if (!review) {
        res.status(400).send(review_errors.REVIEWID_NOT_EXIST);
        return;
    };

    // update review
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
    return;
};
