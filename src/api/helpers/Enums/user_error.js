const user_error = Object.freeze({
    INVALID_EMAIL: {
        success: 0,
        error_type: 31,
        error_msg: "Invalid email."
    },
    INVALID_PASSWORD:{
        success: 0,
        error_type: 32,
        error_message: "Invalid password. Password must contains Capital, non-capital letter, digist, and at least 8 chars long."
    },
    CONFIRMED_PASSWORD_WRONG:{
        success: 0,
        error_type: 33,
        error_message: "Password and confirmed password are different."
    },
    EMAIL_ALREADY_REGISTED:{
        success: 0,
        error_type: 34,
        error_message: "The email has already registed."
    },
    WRONG_PASSWORD:{
        success: 0,
        error_type: 35,
        error_message: "Wrong password."
    },
    EMAIL_NOT_REGISTED:{
        success: 0,
        error_type: 36,
        error_message: "Email is not registed."
    },
});

module.exports = {
    user_error: user_error
};