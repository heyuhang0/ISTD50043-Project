
mockdata = require('../helpers/mockdata');
const Book = require('../models/book');
var Category = require('../models/category');
var async = require('async');
const RandExp = require('randexp');

var mockBooks = mockdata.mockBooks
const asin_regex = /(B0|BT)([0-9A-Z]{8})$/;



// Search books
exports.book_search_get = async function (req, res) {
    let keyword = req.query.keyword;
    let limit = Number(req.query.limit) || 20;
    let offset = Number(req.query.offset) || 0;
    var ASINJson;
    console.log(
        'Searching for books with',
        'keyword=' + keyword,
        'limit=' + limit,
        'offset=' + offset
    );

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
        res.status(400).send({ 
            success: 0,
            error_type: 3,
            error_msg: "empty keywords" 
        });
        console.log("Empty keyword!");
        return;
    }
    // 1. match asin; 2. title/author
    // check if asin and get with asin
    if (asin_regex.test(keyword)) {
        ASINJson = await Book.findOne({ "asin": keyword });
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
    let books = await Book.find({ "$and": keywords_for_find }).limit(limit).skip(limit * offset);
    if (ASINJson) {
        books.push(ASINJson);
    }
    if (books.length > 0) {
        res.json({
            success: 1,
            books: books
        });
    } else {
        res.status(404).send({ 
            success: 0,
            error_type: 5,
            error_msg: "no result found"
        });
    }
    console.log(books.length + " result(s) found");
    // res.json(mockBooks);
};

// testing for find books
exports.book_find_by_price = async function (req, res) {
    var price = parseFloat(req.query.price);
    var q = await Book.exists({ 'price': price });
    res.json({exist: q})
    console.log(q);
}

// Trending books
exports.book_trending_get = function (req, res) {
    Book.find({
        "title": { "$nin": [""] },
        "author": { "$nin": [""] },
        "category": { "$nin": [""] },
        "rating_average": { "$nin": [""] },
        "imUrl": { "$nin": [""] }
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
                books: books
            });
        });
}

// Hot books
exports.book_hot_get = async function (req, res) {
    let hot_books = await Book.find({
        "title": {"$nin": [""]},
        "author": {"$nin": [""]},
        "category": {"$nin": [""]},
        "rating_average": {"$nin": [""]},
        "imUrl": {"$nin": [""]}, 
        "rank": {"$ne":-1}
    })
        .sort([["rank", -1]])
        .limit(10);
    if(hot_books.length>0){
        res.json({
        success: 1,
        books: hot_books});
    }else{
        res.status(404).send({ 
            success: 0,
            error_type: 5,
            error_msg: "no result found"
        });
    } 
}

// Get book on asin
exports.book_details_get = async function (req, res) {
    let bookASIN = req.params.asin;
    console.log('Getting book with ASIN=' + bookASIN);
    let detailed_book = await Book.findOne({ asin: bookASIN });
    if (!detailed_book) {
        console.log('No book found!');
        res.status(404).send({ 
            success: 0,
            error_type: 5,
            error_msg: "no result found"
        });
    } else {
        console.log('Found book with ASIN=' + bookASIN);
        res.json({
            success: 1,
            books: detailed_book});
    }
}

// Handle book create on POST.
exports.book_create_post = async function (req, res, next) {
    //Check if necessary inputs are received
    if (!req.body.title || typeof req.body.title !== "string") {
        res.status(400).send({
            success: 0,
            error_type: 3,
            error_msg: "POST Request Needs 'title' String Parameter"
        });
        return;
    }
    if (!req.body.author || typeof req.body.author !== "string") {
        res.status(400).send({
            success: 0,
            error_type: 3,
            error_msg: "POST Request Needs 'author' String Parameter"
        });
        return;
    }
    if (!req.body.price || typeof req.body.price !== "number") {
        res.status(400).send({
            success: 0,
            error_type: 3,
            error_msg: "POST Request Needs 'price' Number Parameter"
        });
        return;
    }
    if (!req.body.categories || typeof req.body.categories !== "string") {
        res.status(400).send({
            success: 0,
            error_type: 3,
            error_msg: "POST Request Needs 'categories' String Parameter"
        });
        return;
    }
    if (!req.body.description || typeof req.body.description !== "string") {
        res.status(400).send({
            success: 0,
            error_type: 3,
            error_msg: "POST Request Needs 'description' String Parameter"
        });
        return;
    }
    let ifExists = true;
    let newASIN = null;
    while(ifExists){
        newASIN = new RandExp(asin_regex).gen();
        ifExists = await Book.exists({asin: newASIN});
    }
    if(!newASIN){
        var e = new Error('error when generating ASIN')
        e.status = 500;
        throw e;
    }
    req.body.asin = newASIN;
    let newBook = await Book.create(req.body);
    console.log(newBook);
    res.json({ 
        success: 1,
        book: newBook
    });
};


// Get books in a category
exports.book_category_get = async function (req, res) {
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
