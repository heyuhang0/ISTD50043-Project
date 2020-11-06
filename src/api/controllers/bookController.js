
mockdata = require('../helpers/mockdata');
const Book = require('../models/book');

var mockBooks = mockdata.mockBooks

// Search books
exports.book_search_get = function (req, res) {
    let keyword = req.query.keyword;
    // let limit = req.query.limit || 20;
    // let offset = req.query.offset || 0;
    let limit = req.query.limit;
    let offset = req.query.offset;
    console.log(
        'Searching for books with',
        'keyword=' + keyword,
        'limit=' + limit,
        'offset=' + offset);
    var list_of_keyword = keyword.split(" ");
    var keywords_for_find = new Array();
    // 1. match asin; 2. title/author
    if (keyword.length == 10 && keyword.charAt(0) === 'B') {
        Book.findOne({ "asin": keyword }, function (err, book) {
            console.log("1 result found with ASIN!");
            res.json(book);
        });
        return;
    }
    list_of_keyword.forEach(function (value, index, array) {
        keywords_for_find.push({
            "$or": [{ 'author': { "$regex": " " + value, "$options": "i" } }, { 'author': { "$regex": value + " ", "$options": "i" } },
            { 'title': { "$regex": " " + value, "$options": "i" } }, { 'title': { "$regex": value + " ", "$options": "i" } }]
        });
    });
    Book.find({ "$and": keywords_for_find }).limit(parseInt(limit)).skip(parseInt(limit) * parseInt(offset)).exec(function (err, books) {
        console.log(books.length + " result(s) found!");
        res.json(books);
    });
    // res.json(mockBooks);
};

// testing for find books
exports.book_find_by_price = function (req, res) {
    var price = parseFloat(req.query.price);
    var q = Book.find({ 'price': price }).limit(5);
    q.exec(function (err, book) {
        res.json(book);
        console.log(book);
        console.log(book.length + " result(s) found!");
    });
}

// Trending books
exports.book_trending_get = function (req, res) {
    res.json({ 'books': mockBooks });
}

// Recent books
exports.book_recent_get = function (req, res) {
    res.json({ 'books': mockBooks.reverse() });
}

// Get book on asin
exports.book_details_get = function (req, res) {
    let bookASIN = req.params.asin;
    console.log('Getting book with ASIN=' + bookASIN);
    Book.findOne({ asin: bookASIN }, function (err, book) {
        if (book == null) {
            console.log('No book found!');
            res.json('No book found!');
        } else {
            console.log('Find book with ASIN=' + bookASIN);
            res.json(book);
        }
    });
    // res.json(mockBooks[0]);
}

// Handle book create on POST.
exports.book_create_post = function (req, res) {
    Book.create(req.body, function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log(req.body);
            res.json("Create Success");
        }
    });
    // res.send('NOT IMPLEMENTED: Book create POST');
};
