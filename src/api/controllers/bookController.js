
mockdata = require('../helpers/mockdata')

var mockBooks = mockdata.mockBooks

// Search books
exports.book_search_get = function (req, res) {
    let keyword = req.query.keyword;
    let limit = req.query.limit || 20;
    let offset = req.query.offset || 0;
    console.log(
      'Searching for books with',
      'keyword=' + keyword,
      'limit=' + limit,
      'offset=' + offset);
  
    res.json(mockBooks);
}

// Trending books
exports.book_trending_get = function(req,res) {
    res.json({'books': mockBooks});
}

// Recent books
exports.book_recent_get = function(req,res) {
    res.json({'books': mockBooks.reverse()});
}

// Get book on asin
exports.book_details_get = function(req,res) {
    let bookASIN = req.params.asin;
    console.log('Getting book with ASIN=' + bookASIN);
    res.json(mockBooks[0]);
}


// Display book create form on GET.
exports.book_create_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Book create GET');
};

// Handle book create on POST.
exports.book_create_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Book create POST');
};

// Display book delete form on GET.
exports.book_delete_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Book delete GET');
};

// Handle book delete on POST.
exports.book_delete_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Book delete POST');
};

// Display book update form on GET.
exports.book_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Book update GET');
};

// Handle book update on POST.
exports.book_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Book update POST');
};