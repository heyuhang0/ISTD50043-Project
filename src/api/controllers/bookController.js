
mockdata = require('../helpers/mockdata');
const Book = require('../models/book');
var Category = require('../models/category');
var async = require('async')

var mockBooks = mockdata.mockBooks
const asin_regex = /(B0|BT)([0-9A-Z]{8})$/;
// Search books
exports.book_search_get = function (req, res) {
    let keyword = req.query.keyword;
    let limit = Number(req.query.limit) || 20;
    let offset = Number(req.query.offset) || 0;
    var ASINJson;
    console.log(
        'Searching for books with',
        'keyword=' + keyword,
        'limit=' + limit,
        'offset=' + offset);

    // > 100 per page
    if (limit > 100) {
        res.status(400)
            .send({
                success: 0,
                error_type: 1,
                error_msg: "limit must less than 100"
            });
        return;
    };

    // > 1000 records
    if (offset + limit > 1000) {
        console.log((offset + 1) * limit);
        console.log(offset, limit)
        res.status(400)
            .send({
                success: 0,
                error_type: 2,
                error_msg: "exceeding max search limit",
            });
        return;
    };

    if (!keyword) {
        res.json({ message: "Please enter your keywords!" });
        console.log("Empty keyword!");
        return;
    }
    // 1. match asin; 2. title/author
    // check if asin and get with asin
    if (asin_regex.test(keyword)) {
        Book.findOne({ "asin": keyword }, function (err, book) {
            if (err) {
                res.status(400).send({
                    success: 0,
                    error_type: 3,
                    error_msg: "Error during finding book with ASIN"
                });
                return;
            }
            if (book) {
                console.log("1 result found with ASIN!");
            }
            ASINJson = book;
        });
    }
    var list_of_keyword = keyword.split(" ");
    var keywords_for_find = new Array();
    list_of_keyword.forEach(function (value, index, array) {
        if (value !== "") {
            keywords_for_find.push({
                "$or": [{ 'author': { "$regex": " " + value, "$options": "i" } }, { 'author': { "$regex": value + " ", "$options": "i" } },
                { 'title': { "$regex": " " + value, "$options": "i" } }, { 'title': { "$regex": value + " ", "$options": "i" } }]
            });
        }
    });
    // get with title/author
    Book.find({ "$and": keywords_for_find }).limit(limit).skip(limit * offset).exec(function (err, books) {
        if (err) {
            res.status(400).send({
                success: 0,
                error_type: 3,
                error_msg: "Error during finding book with title/author"
            });
            return;
        }
        console.log(books.length + " result(s) found apart from ASIN!");
        if (ASINJson) {
            books.push(ASINJson);
        }
        if (books.length > 0) {
            res.json(books);
        } else {
            res.json({ message: "No result found!" });
        }

    });
    // res.json(mockBooks);
};

// testing for find books
exports.book_find_by_price = function (req, res) {
    var price = parseFloat(req.query.price);
    var q = Book.find({ 'price': price }).limit(5);
    q.exec(function (err, book) {
        if (err) {
            res.status(400).send({
                success: 0,
                error_type: 3,
                error_msg: "Error during finding book by price"
            });
            return;
        }
        res.json(book);
        console.log(book.length + " result(s) found!");
    });
}

// Trending books
exports.book_trending_get = function (req, res) {
    Book.find({
        "title": {"$nin": [""]},
        "author": {"$nin": [""]},
        "category": {"$nin": [""]},
        "rating_average": {"$nin": [""]},
        "imUrl": {"$nin": [""]}
    })
        .sort([["review_number", -1], ["rating_average", -1]])
        .limit(10)
        .exec(function (err, books) {
            if (err) {
                res.status(400).send({
                    success: 0,
                    error_type: 2,
                    error_msg: "Error during finding trending books"
                });
                return;
            }
            res.json({
                success: 1,
                books: books});
        });
}

const sqlquery = "SELECT asin FROM reviews \
    WHERE ";

// Recent books
exports.book_recent_get = function (req, res) {

    res.json({ success: 1, books: mockBooks.reverse() });
}

// Get book on asin
exports.book_details_get = function (req, res) {
    let bookASIN = req.params.asin;
    console.log('Getting book with ASIN=' + bookASIN);
    Book.findOne({ asin: bookASIN }, function (err, book) {
        if (err) {
            console.log(err);
            res.status(400).send({
                success: 0,
                error_type: 2,
                error_msg: "Error during getting book details"
            });
            return;
        }
        if (!book) {
            console.log('No book found!');
            res.json({ message: 'No book found!' });
        } else {
            console.log('Find book with ASIN=' + bookASIN);
            res.json(book);
        }
    });
}

// Handle book create on POST.
exports.book_create_post = function (req, res, next) {
    try {
        //Check if necessary inputs are received
        if (!req.query.title || typeof req.body.title !== "string") {
            throw new Error("POST Request Needs 'title' String Parameter");
        }
        if (!req.query.author || typeof req.body.author !== "string") {
            throw new Error("POST Request Needs 'author' String Parameter");
        }
        if (!req.query.price || typeof req.body.price !== "number") {
            throw new Error("POST Request Needs 'price' Number Parameter");
        }
        if (!req.query.categories || typeof req.body.categories !== "string") {
            throw new Error("POST Request Needs 'categories' String Parameter");
        }
        if (!req.query.description || typeof req.body.description !== "string") {
            throw new Error("POST Request Needs 'description' String Parameter");
        }
    } catch (e) {
        return next(e);
    }
    Book.create(req.body, function (err) {
        if (err) {
            console.log(err);
            res.status(400).send({
                success: 0,
                error_type: 2,
                error_msg: "Error during creating a new book"
            });
            return;
        }
        console.log(req.body);
        res.json({ message: "Create Success" });
    });
    // res.send('NOT IMPLEMENTED: Book create POST');
};


// Get books in a category
exports.book_category_get = function (req, res) {
    let category = req.params.category;
    let limit = Number(req.query.limit) || 20;
    let offset = Number(req.query.offset) || 0;
    console.log(
        'Searching for category with',
        'keyword=' + category,
        'limit=' + limit,
        'offset=' + offset
    );

    // each page > 100 records
    if (limit > 100) {
        res.status(400)
            .send({
                success: 0,
                error_type: 1,
                error_msg: "limit must less than 100"
            });
        return;
    };

    // > 1000 records
    if (offset + limit > 1000) {
        console.log((offset + 1) * limit);
        console.log(offset, limit)
        res.status(400)
            .send({
                success: 0,
                error_type: 2,
                error_msg: "exceeding max search limit",
            });
        return;
    };

    async.waterfall([
        function (callback) {
            Category.findOne({ category: category })
                .exec(function (err, category_found) {
                    callback(err, category_found)
                });
        },
        function (category_found, callback) {
            console.log(category_found)
            if (!category_found) {
                console.log("no such category")
                callback(null, null)
            } else {
                console.log(category_found.category);
                Book.find({ category: category_found.category })
                    .skip(offset)
                    .sort({ rating_total: -1 })
                    .limit(limit)
                    .exec(function (err, list_books) {
                        callback(err, list_books)
                    });
            }
        }
    ], function (err, list_books) {
        if (err) {
            console.log(err);
            res.status(500)
                .send({
                    success: 0,
                    error_type: 3,
                    error_msg: "Internal Error"
                });
            return;
        }
        if (!list_books) {
            res.status(400)
                .send({
                    success: 0,
                    error_type: 4,
                    error_msg: "no such category"
                });
            return;
        }
        console.log(list_books.length)
        res.json({
            success: 1,
            books: list_books,
        });
    });
};
