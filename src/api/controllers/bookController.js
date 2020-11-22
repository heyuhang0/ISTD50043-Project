
const Book = require('../models/book');
const Category = require('../models/category');
const RandExp = require('randexp');

const book_errors = require('../helpers/Enums/book_error').book_error;
const common_errors = require('../helpers/Enums/common_errors').common_error;
const book_sort_keyword = require('../helpers/Enums/book_sort').book_sort_keyword;
const book_sort_statement = require('../helpers/Enums/book_sort').book_sort_statement;
const asin_regex = require('../helpers/Constants/app_constant').app_constant.ASIN_REGEX;

/**
 * Search books given keywords
 * @param {*} req 
 * query: keyword(string, required, not empty), 
 *        limit(number, optional, default 20), 
 *        offset(number, optional, default 0), 
 *        sort(string, optional, enum in book_sort_keyword, optianl)
 * @param {*} res 
 * {
 *      success: 1,
 *      books: array of objects(book list, can be empty)
 * }
 * OR 
 * {success: 0, err_type: Number, err_msg: String} (Enum in common_error or book_error)
 */
exports.book_search_get = async function (req, res) {
    let keyword = req.query.keyword;
    let limit = Number(req.query.limit) || 20;
    let offset = Number(req.query.offset) || 0;
    let ASINJson;
    let sort_statement;
    console.log(
        'Searching for books with',
        'keyword=' + keyword,
        'limit=' + limit,
        'offset=' + offset
    );

    // > 100 per page
    if (limit > 100) {
        res.status(400)
            .send(common_errors.EXCEED_LIMIT);
        return;
    };

    // > 1000 records
    if (offset + limit > 1000) {
        res.json({
            success: 1,
            books: []
        });
        return;
    };

    // not keyword
    if (!keyword) {
        res.status(400).send(book_errors.EMPTY_SEARCH_KEYWORDS);
        console.log("Empty keyword!");
        return;
    }

    // 1. check if asin format and match;
    if (asin_regex.test(keyword)) {
        ASINJson = await Book.findOne({ "asin": keyword });
        console.log("finding book by asin " + keyword);
        if (ASINJson) {
            res.json({
                success: 1,
                books: [ASINJson]
            });
            console.log("found book with asin " + keyword);
            return;
        } else {
            res.json({
                success: 1,
                books: []
            });
            console.log("Cannot find book with asin " + keyword);
            return;
        }
    };

    // sort statement
    let sort_key = Object.keys(book_sort_keyword).find(key => book_sort_keyword[key] === req.query.sort);
    if(sort_key){
        sort_statement = book_sort_statement[sort_key];
    }else{
        sort_statement = book_sort_statement.REVIEW_NUM_DESC;
    };

    // find records by each keyword
    let list_of_keyword = keyword.split(" ");
    let keywords_for_find = new Array();
    list_of_keyword.forEach(function (value, index, array) {
        if (value !== "") {
            keywords_for_find.push({
                "$or": [{ 'author': { "$regex": " " + value, "$options": "i" } }, { 'author': { "$regex": value + " ", "$options": "i" } },
                { 'title': { "$regex": " " + value, "$options": "i" } }, { 'title': { "$regex": value + " ", "$options": "i" } }]
            });
        }
    });
    // get with title/author
    let books = await Book.find({ "$and": keywords_for_find })
        .sort([sort_statement])
        .limit(limit)
        .skip(limit * offset);

    res.json({
        success: 1,
        books: books
    });
    console.log(books.length + " result(s) found");
    return;
};

/**
 * Trending books by review number and rating
 * @param {*} req 
 * @param {*} res 
 * {
 *      success: 1
 *      books: array of objects (book_list, non empty)
 * }
 */
exports.book_trending_get = async function (req, res) {
    let trending_books = await Book.find({
        "title": { "$nin": [""] },
        "author": { "$nin": [""] },
        "category": { "$nin": [""] },
        "rating_average": { "$nin": [0] },
        "imUrl": { "$nin": [""] }
    })
        .sort([["review_number", -1], ["rating_average", -1]])
        .limit(10)
    res.json({
        success: 1,
        books: trending_books
    });
    return;
}

/**
 * Hot books by ascending ranks
 * @param {*} req 
 * @param {*} res 
 * {
 *      success: 1
 *      books: array of objects (book_list, non empty)
 * }
 */
exports.book_hot_get = async function (req, res) {
    let hot_books = await Book.find({
        "title": { "$nin": [""] },
        "author": { "$nin": [""] },
        "category": { "$nin": [""] },
        "rating_average": { "$nin": [0] },
        "imUrl": { "$nin": [""] },
        "rank": { "$ne": -1 }
    })
        .sort([["rank", 1]])
        .limit(10);
    res.json({
        success: 1,
        books: hot_books
    });
    return;
}

/**
 * Get book on asin
 * @param {*} req params: asin(string, required)
 * @param {*} res 
 * {
 *      success: 1, 
 *      book: object(non-empty), 
 *      related: object array(related 10 book list)
 * }
 * OR 
 * {success: 0, err_type: Number, err_msg: String} (Enum in common_error or book_error)
 */
exports.book_details_get = async function (req, res) {
    let bookASIN = req.params.asin;
    console.log('Getting book with ASIN=' + bookASIN);

    // asin does not exists
    let detailed_book = await Book.findOne({ asin: bookASIN });
    if (!detailed_book) {
        console.log('No book found!');
        res.status(400).send(book_errors.BOOK_ASIN_NOT_EXIST);
        return;
    }
    console.log('Found book with ASIN=' + bookASIN);

    let related_asin = detailed_book.related;
    let book_category = detailed_book.category;

    // find related books details
    let related_book_details = await Book.find({
        "asin": { "$in": related_asin }
    });

    // related book number < 10, get same categories book for recommendation
    if (related_book_details.length < 10) {
        console.log("related books number less than 10, is " + related_book_details.length)
        let categoryed_books = await Book.find({
            "asin": { "$nin": related_asin },
            "category": book_category,
            "title": { "$nin": [""] },
            "author": { "$nin": [""] },
            "rating_average": { "$nin": [0] },
            "imUrl": { "$nin": [""] }
        }).limit(10 - related_book_details.length)
        related_book_details = related_book_details.concat(categoryed_books);
    };

    res.json({
        success: 1,
        book: detailed_book,
        related: related_book_details
    });
    return;
}

/**
 * Create a book
 * @param {*} req 
 * body: title(String, required), 
 *       author(String, required), 
 *       category(String, required), 
 *       description(String, required), 
 *       price(Number, required)
 * @param {*} res 
 * {
 *      success: 1,
 *      book: object(created book)
 * }
 * OR 
 * {success: 0, err_type: Number, err_msg: String} (Enum in common_error or book_error)
 */
exports.book_create_post = async function (req, res) {
    //Check if necessary inputs are received
    if (!req.body.title || !req.body.author || !req.body.price || !req.body.category || !req.body.description) {
        res.status(400).send(common_errors.MISSING_REQUIRED_PARAMS);
        return;
    }

    // not desired type
    if (typeof req.body.price !== "number"){
        res.status.send(common_errors.BODY_PARAMS_WRONG_TYPE);
        return;
    }

    // Generate asin
    let ifExists = true;
    let newASIN = null;
    while (ifExists) {
        newASIN = new RandExp(asin_regex).gen();
        ifExists = await Book.exists({ asin: newASIN });
    }
    if (!newASIN) {
        let e = new Error('error when generating ASIN')
        e.status = 500;
        throw e;
    }

    // create book in db
    req.body.asin = newASIN;
    let newBook = await Book.create(req.body);
    res.json({
        success: 1,
        book: newBook
    });
    return;
};

/**
 * Get book in a category
 * @param {*} req params: category(string, required); 
 * query: limit(number, optional, default 20), 
 *        offset(number, optional, default 0), 
 *        sort(string, optional, enum in book_sort_keyword, optianl)
 * @param {*} res 
 * {
 *      success: 1
 *      books: object array
 * }
 * OR
 * {success: 0, err_type: Number, err_msg: String} (Enum in common_error or book_error)
 */
exports.book_category_get = async function (req, res) {
    let category = req.params.category;
    let limit = Number(req.query.limit) || 20;
    let offset = Number(req.query.offset) || 0;
    let sort_statement;
    console.log(
        'Searching for category with',
        'keyword=' + category,
        'limit=' + limit,
        'offset=' + offset
    );

    // each page > 100 records
    if (limit > 100) {
        res.status(400).send(common_errors.EXCEED_LIMIT);
        return;
    };

    // > 1000 records
    if (offset + limit > 1000) {
        res.json({
            success: 1,
            books: []
        });
        return;
    };

    // check the category exists
    let desired_category = await Category.findOne({ category: category });
    if (!desired_category) {
        res.status(400).send(book_errors.BOOK_CATEGORY_NOT_EXIST);
        return;
    }

    // sort statement
    let sort_key = Object.keys(book_sort_keyword).find(key => book_sort_keyword[key] === req.query.sort);
    if(sort_key){
        sort_statement = book_sort_statement[sort_key];
    }else{
        sort_statement = book_sort_statement.REVIEW_NUM_DESC;
    };

    // get books
    let list_books = await Book.find({ category: desired_category.category })
        .skip(offset)
        .sort([sort_statement])
        .limit(limit)
    res.json({
        success: 1,
        books: list_books,
    });
    return;
};
