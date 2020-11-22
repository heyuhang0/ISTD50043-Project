
mockdata = require('../helpers/mockdata');
const Book = require('../models/book');
var Category = require('../models/category');
const RandExp = require('randexp');

var mockBooks = mockdata.mockBooks
const asin_regex = /(B0|BT)([0-9A-Z]{8})$/;



// Search books
/**
 * Search books given keywords
 * @param {*} req query: keyword, limit, offset
 * @param {*} res 
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

    switch (req.query.sort) {
        case 'review_num_desc':
            sort_statement = ['review_number', -1];
            break;
        case 'review_num_asc':
            sort_statement = ['review_number', 1];
            break;
        case 'rating_desc':
            sort_statement = ['rating_average', -1];
            break;
        case 'rating_asc':
            sort_statement = ['rating_average', 1];
            break;
        case 'category_desc':
            sort_statement = ['category', -1];
            break;
        case 'category_asc':
            sort_statement = ['category', 1];
            break;
        default:
            sort_statement = ['rating_average', -1];
            break;
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
    let books = await Book.find({ "$and": keywords_for_find })
        .sort([sort_statement])
        .limit(limit)
        .skip(limit * offset);

    res.json({
        success: 1,
        books: books
    });
    console.log(books.length + " result(s) found");
};

// testing for find books
exports.book_find_by_price = async function (req, res) {
    var price = parseFloat(req.query.price);
    var q = await Book.exists({ 'price': price });
    res.json({ exist: q })
    console.log(q);
}

// Trending books
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
}

// Hot books
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

}

/**
 * Get book on asin
 * @param {*} req params: asin
 * @param {*} res success: 1, book: object, related: object array; OR err_type, err_msg
 */
exports.book_details_get = async function (req, res) {
    let bookASIN = req.params.asin;
    console.log('Getting book with ASIN=' + bookASIN);
    let detailed_book = await Book.findOne({ asin: bookASIN });
    if (!detailed_book) {
        console.log('No book found!');
        res.status(400).send({
            success: 0,
            error_type: 1,
            error_msg: "ASIN does not exists."
        });
        return;
    }
    console.log('Found book with ASIN=' + bookASIN);
    let related_asin = detailed_book.related;
    let book_category = detailed_book.category;

    // find related books details
    let related_book_details = await Book.find({
        "asin": { "$in": related_asin }
    });
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
}

/**
 * Create a book
 * @param {*} req body: title(String), author(String), category(String), 
 * description(String), price(Number)
 * @param {*} res book: newBook
 */
exports.book_create_post = async function (req, res) {
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
    if (!req.body.category || typeof req.body.category !== "string") {
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
    while (ifExists) {
        newASIN = new RandExp(asin_regex).gen();
        ifExists = await Book.exists({ asin: newASIN });
    }
    if (!newASIN) {
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


/**
 * Get book in a category
 * @param {*} req req params: category; query: limit, offset, sort
 * @param {*} res 
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

    let desired_category = await Category.findOne({ category: category });
    if (!desired_category) {
        res.status(400).send({
            success: 0,
            error_type: 1,
            error_msg: "category does not exists"
        });
        return;
    }

    switch (req.query.sort) {
        case 'review_num_desc':
            sort_statement = ['review_number', -1];
            break;
        case 'review_num_asc':
            sort_statement = ['review_number', 1];
            break;
        case 'rating_desc':
            sort_statement = ['rating_average', -1];
            break;
        case 'rating_asc':
            sort_statement = ['rating_average', 1];
            break;
        default:
            sort_statement = ['rating_average', -1];
            break;
    }


    let list_books = await Book.find({ category: desired_category.category })
        .skip(offset)
        .sort([sort_statement])
        .limit(limit)
    res.json({
        success: 1,
        books: list_books,
    });
};
