const review_sort_keyword = Object.freeze({
    RATING_DESC: {
        name: 'create_desc',
        sort_statement: ['createdAt', -1]
    },
    RATING_ASC: {
        name: 'create_asc',
        sort_statement: ['createdAt', 1]
    },
    REVIEW_NUM_DESC: {
        name: 'helpful_desc',
        sort_statement: ['helpful', -1]
    },
    REVIEW_NUM_ASC: {
        name: 'helpful_desc',
        sort_statement: ['helpful', 1]
    },
    RATING_DESC: {
        name: 'rating_desc',
        sort_statement: ['rating', -1]
    },
    RATING_ASC: {
        name: 'rating_asc',
        sort_statement: ['rating', 1]
    }
});

module.exports = {
    review_sort_keyword: review_sort_keyword
};
