const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require("../models/sequelizeIndex");
const User = db.user;
const hash_key = process.env.PASSWORD_HASH_KEY;
const authentication_secret = process.env.AUTHENTICATION_SECRET;
const email_regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const password_regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

exports.login_post = async function (req, res) {
    let email = req.body.email;
    let password = req.body.password;
    // Incorrect format
    if (!email || !password || !email_regex.test(email) || !password_regex.test(password)) {
        res.status(400)
            .send({
                success: 0,
                error_type: 1,
                error_msg: "Please enter valid email and password"
            });
        return;
    };

    //find user in db
    let user;
    user = await User.findOne({
        attributes: ["userId", "name", "email", "password"],
        where: { email: email }
    });

    // user not found in db
    if (!user) {
        res.status(400)
            .send({
                success: 0,
                error_type: 2,
                error_msg: "User not registed"
            });
        return;
    };

    // password incorrect
    if (bcrypt.hashSync(password, hash_key) != user.password) {
        res.status(400)
            .send({
                success: 0,
                error_type: 3,
                error_msg: "Incorrect password"
            });
        return;
    }
    const token = jwt.sign({ user: user.userId }, authentication_secret);
    res.json({
        success: 1,
        token: token
    });
};


exports.register_post = async function (req, res, next) {
    let email = req.body.email;
    let name = req.body.name;
    let password = req.body.password;
    let password2 = req.body.password2;

    // Incorrect format
    if (!email || !password || !password2 || !name) {
        res.status(400)
            .send({
                success: 0,
                error_type: 1,
                error_msg: "Please enter valid email, password and confirmed password"
            });
        return;
    }

    // invalid email
    if (!email_regex.test(email)) {
        res.status(400)
            .send({
                success: 0,
                error_type: 2,
                error_msg: "Invalid Email"
            });
        return;
    }

    // invalid password
    if (!password_regex.test(password)) {
        res.status(400)
            .send({
                success: 0,
                error_type: 3,
                error_msg: "Invalid Password"
            });
        return;
    }

    // password not the same
    if (password != password2) {
        res.status(400)
            .send({
                success: 0,
                error_type: 4,
                error_msg: "Confirmed password and password are different"
            });
        return;
    }

    //find user in db
    let user;
    user = await User.findOne({
        attributes: ["userId", "name", "email"],
        where: { email: email }
    });

    if (user) {
        res.status(400)
            .send({
                success: 0,
                error_type: 5,
                error_msg: "User already registered"
            });
        return;
    }

    //add user to db
    const hash_password = bcrypt.hashSync(password, hash_key);
    let created_user;
    created_user = await User.create({
        email: email,
        password: hash_password,
        name: name
    });

    const token = jwt.sign({ user: created_user.userId }, authentication_secret);
    res.json({
        success: 1,
        token: token
    });
};

exports.current_user_get = async function (req, res) {
    let token = req.headers.authorization;
    if (!token || !token.startsWith("Bearer ")) {
        res.status(401).send({
            success: 0,
            error_type: 1,
            error_message: "failed to authenticate user."
        });
        return;
    };
    token = token.substring(7, token.length);
    try {
        userId = jwt.verify(token, authentication_secret).user;
    } catch (err) {
        res.status(401).send({
            success: 0,
            error_type: 1,
            error_message: "failed to authenticate user."
        });
        return;
    };

    let user = await User.findOne({
        attributes: ["userId", "name", "email"],
        where: { userId: userId }
    });

    res.json(user);
}