var express = require('express');
var reviewsRouter = require('./reviews');

var router = express.Router();

var mockBooks = [
  {
    asin: "B00A287PG2",
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    imUrl: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1553383690l/2657.jpg",
    rating: 4.28,
    ratingCount: 4498763
  },
  {
    asin: "B008S38QHU",
    title: "1984",
    author: "George Orwell",
    imUrl: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1532714506l/40961427._SX318_.jpg",
    rating: 4.19,
    ratingCount: 3138298
  },
  {
    asin: "B01N1Y1ULL",
    title: "Harry Potter and the Sorcerer's Stone (Harry Potter, #1)",
    author: "J.K. Rowling",
    imUrl: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1474154022l/3._SY475_.jpg",
    rating: 4.47,
    ratingCount: 7044409
  },
  {
    asin: "B01AYDJWZQ",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    imUrl: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1490528560l/4671._SY475_.jpg",
    rating: 3.92,
    ratingCount: 3773727
  },
  {
    asin: "B014T6N5J8",
    title: "Animal Farm",
    author: "George Orwell",
    imUrl: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1325861570i/170448._SY475_.jpg",
    rating: 3.95,
    ratingCount: 2739074
  }
];

router.get('/', function (req, res, next) {
  let keyword = req.query.keyword;
  let limit = req.query.limit || 20;
  let offset = req.query.offset || 0;
  console.log(
    'Searching for books with',
    'keyword=' + keyword,
    'limit=' + limit,
    'offset=' + offset);

  res.json(mockBooks);
});

router.post('/', function (req, res, next) {
  res.json({ message: "success" });
});

router.get('/trending', function (req, res, next) {
  res.json(mockBooks);
});

router.get('/recent', function (req, res, next) {
  res.json(mockBooks.reverse());
});

router.get('/:asin', function (req, res, next) {
  let bookASIN = req.params.asin;
  console.log('Getting book with ASIN=' + bookASIN);

  res.json(mockBooks[0]);
});

router.use('/:asin/reviews', reviewsRouter);

module.exports = router;
