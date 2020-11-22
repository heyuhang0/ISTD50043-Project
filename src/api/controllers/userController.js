const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require("../models/sequelizeIndex");
const User = db.user;

const authentication_secret = process.env.AUTHENTICATION_SECRET;
const user_error = require('../helpers/Enums/user_error').user_error;
const common_error = require('../helpers/Enums/common_errors').common_error;
const app_constants = require('../helpers/Constants/app_constant').app_constant;
const email_regex = app_constants.EMAIL_REGEX;
const password_regex = app_constants.PASSWORD_REGEX;

/**
 * Login user.
 * @param {*} req 
 * body: email(string, required), 
 *       password(string, required)
 * @param {*} res  
  {
        success: 1,
        userId: Number,
        email: string,
        name: string,
        token: string
   }
    OR 
    {success: 0, err_type: Number, err_msg: String} (Enum in common_error or user_error)
 */
exports.login_post = async function (req, res) {
    let email = req.body.email;
    let password = req.body.password;
    console.log("Logging in user with email=" + email);
    // Incorrect format
    if (!email || !password) {
        res.status(400).send(common_error.MISSING_REQUIRED_PARAMS);
        return;
    };

    if (!email_regex.test(email)) {
        res.status(400).send(user_error.INVALID_EMAIL);
        return;
    };

    if (!password_regex.test(password)) {
        res.status(400).send(user_error.INVALID_PASSWORD);
        return;
    }

    //find user in db
    let user;
    user = await User.findOne({
        attributes: ["userId", "name", "email", "password"],
        where: { email: email }
    });

    // user not found in db
    if (!user) {
        res.status(400).send(user_error.EMAIL_NOT_REGISTED);
        return;
    };

    // password incorrect
    if (bcrypt.hashSync(password, bcrypt.getSalt(user.password)) != user.password) {
        res.status(400).send(user_error.WRONG_PASSWORD);
        return;
    }
    const token = jwt.sign(
        {
            userId: user.userId,
            email: user.email,
            name: user.name
        },
        authentication_secret);
    res.json({
        success: 1,
        userId: user.userId,
        email: user.email,
        name: user.name,
        token: token
    });
};

/**
 * Register a user.
 * @param {*} req 
 * body: email(string, required), 
 *       name(string, required), 
 *       password(string, required), 
 *       password2(string, required)
 * @param {*} res 
    {
        success: 1,
        userId: Number,
        email: string,
        name: string,
        token: string
   }
    OR 
    {success: 0, err_type: Number, err_msg: String} (Enum in common_error or user_error)
 */
exports.register_post = async function (req, res) {
    let email = req.body.email;
    let name = req.body.name;
    let password = req.body.password;
    let password2 = req.body.password2;

    console.log(
        "Registering user with email=" + email,
        "name=" + name
    );
    // Incorrect format
    if (!email || !password || !password2 || !name) {
        res.status(400).send(common_error.MISSING_REQUIRED_PARAMS);
        return;
    }

    // invalid email
    if (!email_regex.test(email)) {
        res.status(400).send(user_error.INVALID_EMAIL);
        return;
    }

    // invalid password
    if (!password_regex.test(password)) {
        res.status(400).send(user_error.INVALID_PASSWORD);
        return;
    }

    // password not the same
    if (password != password2) {
        res.status(400).send(user_error.CONFIRMED_PASSWORD_WRONG);
        return;
    }

    //find user in db
    let user;
    user = await User.findOne({
        attributes: ["userId", "name", "email"],
        where: { email: email }
    });

    if (user) {
        res.status(400).send(user_error.EMAIL_ALREADY_REGISTED);
        return;
    }

    //add user to db
    const hash_password = bcrypt.hashSync(password, 10);
    let created_user;
    created_user = await User.create({
        email: email,
        password: hash_password,
        name: name
    });

    const token = jwt.sign(
        {
            user: created_user.userId,
            email: email,
            name: name
        },
        authentication_secret);
    res.json({
        success: 1,
        userId: created_user.userId,
        email: email,
        name: name,
        token: token
    });
};

/**
 * Get user's information using token
 * @param {*} req 
 * headers: authorization(string, required)
 * @param {*} res 
 * { success:1, userId: Number, name: string, email: string }
 * OR 
 * {success: 0, err_type: Number, err_msg: String} (Enum in common_error or user_error)
 */
exports.current_user_get = async function (req, res) {
    console.log("Getting current user's information");

    // check token
    let token = req.headers.authorization;
    if (!token || !token.startsWith("Bearer ")) {
        res.status(401).send(common_error.AUTHENTICATION_ERROR);
        return;
    };
    token = token.substring(7, token.length);
    
    // get user info from token
    try {
        user_object = jwt.verify(token, authentication_secret);
        userId = user_object.user;
        name = user_object.name;
        email = user_object.email;
    } catch (err) {
        res.status(401).send(common_error.AUTHENTICATION_ERROR);
        return;
    };
    res.json({ success: 1, userId: userId, name: name, email: email });
}