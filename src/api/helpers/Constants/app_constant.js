const app_constant = Object.freeze({
    ASIN_REGEX = /(B0|BT)([0-9A-Z]{8})$/,
    EMAIL_REGEX = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    PASSWOR_REGEX = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/
});

module.exports = {
    app_constant: app_constant
};