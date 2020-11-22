const book_error = Object.freeze({
    BOOK_ASIN_NOT_EXIST: {
        success: 0,
        error_type: 11,
        error_msg: "Book asin does not exists."
    },
    BOOK_CATEGORY_NOT_EXIST: {
        success: 0,
        error_type: 12,
        error_msg: "Category does not exists."
    },
    EMPTY_SEARCH_KEYWORDS: {
        success: 0,
        error_type: 13,
        error_msg: "Empty search keywords."
    }
});
module.exports = {
    book_error: book_error
};