const book_sort_keyword = Object.freeze({
    RATING_DESC: {
        name: 'rating_desc',
        sort_statement: ['rating_average', -1]
    },
    RATING_ASC: {
        name: 'rating_asc',
        sort_statement: ['rating_average', -1]
    },
    REVIEW_NUM_DESC: {
        name: 'review_num_desc',
        sort_statement: ['review_number', -1]
    },
    REVIEW_NUM_ASC: {
        name: 'review_num_asc',
        sort_statement: ['review_number', -1]
    },
    CATEGORY_DESC: {
        name: 'category_desc',
        sort_statement: ['category', -1]
    },
    CATEGORY_ASC: {
        name: 'category_asc',
        sort_statement: ['category', -1]
    }
});

module.exports = {
    book_sort_keyword: book_sort_keyword
}
