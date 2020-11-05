const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BookSchema = new Schema({
    title: {
        type: String,
        required: [true, "'title' field required"]
    },
    author: {
        type: String, 
        required: [true, "'author' field required"]
    },
    price: {
        type: String,
        required: [true, "'price' field required"]
    },
    categories: {
        type: String, 
        required: [true, "'categories' field required"]
    },
    asin: {
        type: String, 
        required: [true, "'asin' field required"]
    },
    imUrl: String, 
    description: {
        type: String,
        required: [true, "'description' field required"]
    }, 
    related: [String],
    rank: Number, 
});

const Book = mongoose.model('books', BookSchema);

module.exports = Book;