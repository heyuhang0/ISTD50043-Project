var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var CategorySchema = new Schema(
  {
    category: { type: String, required: true},
    book_count: {type: Number, default: 1}
  }
);

//Export model
module.exports = mongoose.model('Category', CategorySchema);