
var Category = require('../models/category');
mockdata = require('../helpers/mockdata');

exports.all_categories_get = function (req, res) {
  console.log("getting all categories");
  Category.find()
    .populate('categories')
    .exec(function (err, list_genres) {
      if (err) { return next(err); }
      //Successful, so render
      res.json({ category_list: list_genres });
    });
}

exports.suggested_categories_get = function (req, res) {
  console.log("getting suggested categories");
  Category.find()
    .populate('categories')
    .sort({ book_count: -1 })
    .limit(10)
    .exec(function (err, list_genres) {
      if (err) { return next(err); }
      //Successful, so render
      res.json({ category_list: list_genres });
    });
}
