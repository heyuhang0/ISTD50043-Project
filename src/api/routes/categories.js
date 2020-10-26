var express = require('express');
var router = express.Router();

router.get('/tree', function (req, res, next) {
  res.json({});
});

var mockCategoriesSuggestions = [
  "Art",
  "Biography",
  "Business",
  "Children's",
  "Christian",
  "Classics",
  "Comics",
  "Cookbooks"
];

router.get('/suggested', function (req, res, next) {
  res.json(mockCategoriesSuggestions);
});

module.exports = router;
