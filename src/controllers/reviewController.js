
mockdata = require('../helpers/mockdata');

var mockReviews = mockdata.mockReview;


// get review for one book
exports.review_for_a_book_get = function(req, res, next) {
    let bookASIN = req.params.asin;
    let limit = req.query.limit || 20;
    let offset = req.query.offset || 0;
    console.log('Getting reviews',
      'for book ASIN=' + bookASIN,
      'with limit=' + limit,
      'and offset=' + offset);
    res.json({
        reviews: mockReviews, user_review_id: null
    });
};

// Handle review create on POST.
exports.review_create_post = function(req, res) {
    let bookASIN = req.params.asin;
    console.log('Posting review for book ASIN=' + bookASIN);
    res.json({ message: "success" });
};

// Handle review delete on POST.
exports.review_delete_post = function(req, res) {
    let reviewID = req.params.reviewid;
    console.log('Deleting review ' + reviewID);
    res.json({ message: "success" });
};

// Handle review update on POST.
exports.review_update_post = function(req, res) {
    let reviewID = req.params.reviewid;
    console.log('updating review ' + reviewID);
    res.json({ message: "success" });
};

// Handle upvote review on POST.
exports.review_upvote_post = function(req, res) {
    let reviewID = req.params.reviewid;
    console.log('upvoting review ' + reviewID);
    res.json({ message: "success" });
};
