const book_sort_keyword = Object.freeze({
    RATING_DESC: 'rating_desc',
    RATING_ASC: 'rating_asc',
    REVIEW_NUM_DESC: 'review_num_desc',
    REVIEW_NUM_ASC: 'review_num_asc',
    CATEGORY_DESC: 'category_desc',
    CATEGORY_ASC: 'category_asc',
});

const book_sort_statement = Object.freeze({
    RATING_DESC: ['rating_average', -1],
    RATING_ASC: ['rating_average', 1],
    REVIEW_NUM_DESC: ['review_number', -1],
    REVIEW_NUM_ASC: ['review_number', 1],
    CATEGORY_DESC: ['category', -1],
    CATEGORY_ASC: ['category', 1]
});

module.exports = {
    book_sort_keyword: book_sort_keyword,
    book_sort_statement: book_sort_statement
}
