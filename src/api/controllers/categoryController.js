mockdata = require('../helpers/mockdata');

var mockCategories = mockdata.mockCategories;

exports.all_categories_get = function(req, res){
    console.log("getting all categories");
    res.json({categories: mockCategories});
}

exports.suggested_categories_get = function(req, res){
    console.log("getting suggested categories");
    res.json({categories: mockCategories});
}