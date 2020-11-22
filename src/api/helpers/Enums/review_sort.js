const review_sort_keyword = Object.freeze({
    CREATE_DESC: 'create_desc',
    CREATE_ASC: 'create_asc',
    HELPFUL_DESC: 'helpful_desc',
    HELPFUL_ASC: 'helpful_desc',
    RATING_DESC: 'rating_desc',
    RATING_ASC: 'rating_asc'
});

const review_sort_statement = Object.freeze({
    CREATE_DESC: ['createdAt', 'DESC'],
    CREATE_ASC: ['createdAt', 'ASC'],
    HELPFUL_DESC: ['helpful', 'DESC'],
    HELPFUL_ASC: ['helpful', 'ASC'],
    RATING_DESC: ['rating', 'DESC'],
    RATING_ASC: ['rating', 'ASC']
});

module.exports = {
    review_sort_keyword: review_sort_keyword,
    review_sort_statement: review_sort_statement
};
