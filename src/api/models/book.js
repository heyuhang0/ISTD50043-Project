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
        type: Number,
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
    review_number: {
        type: String,
        default: "0"    
    }, 
    rating_average: {
        type: String, 
        default: "0"
    }, 
    rating_total:{
        type: String, 
        default: "0"
    } 
});

const Book = mongoose.model('books', BookSchema);

module.exports = Book;