const review_error = Object.freeze({
    BOOK_ASIN_NOT_EXIST_OR_INVALID: {
        success: 0,
        error_type: 21,
        error_msg: "Invalid asin or asin does not exists."
    },
    REVIEWID_NOT_EXIST:{
        success: 0,
        error_type: 22,
        error_message: "ReviewId does not exists."
    }
});

module.exports = {
    review_error: review_error
};