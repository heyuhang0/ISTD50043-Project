
const Category = require('../models/category');

/**
 * Get all categories
 * @param {*} req 
 * @param {*} res category list
 */
exports.all_categories_get = async function (req, res) {
  console.log("getting all categories");
  let categories = await Category.find();
  res.json({
    success: 1,
    category_list: categories
  });
}

/**
 * Get suggested categoreis by book number
 * @param {*} req 
 * @param {*} res suggested category list
 */
exports.suggested_categories_get = async function (req, res) {
  console.log("getting suggested categories");
  let suggested_categories = await Category.find()
    .sort({ book_count: -1 })
    .limit(10);
  res.json({
    success: 1,
    category_list: suggested_categories
  });
}
