const common_error = Object.freeze({
    MISSING_REQUIRED_PARAMS: {
        success: 0,
        error_type: 1,
        error_msg: "Missing required parameters."
    },
    BODY_PARAMS_WRONG_TYPE: {
        success: 0,
        error_type: 1,
        error_msg: "Body parameters are of wrong type."
    },
    AUTHENTICATION_ERROR:{
        success: 0,
        error_type: 2,
        error_message: "Failed to authenticate user."
    },
    EXCEED_LIMIT: {
        success: 0,
        error_type: 3,
        error_msg: "Limit must less than 100"
    },
    EXCEED_MAX_SEARCH: {
        success: 0,
        error_type: 4,
        error_msg: "Exceeding max search limit."
    }
});

module.exports = {
    common_error: common_error
};