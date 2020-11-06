var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
const hash_key = process.env.PASSWORD_HASH_KEY;
const email_regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const password_regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

const user = "mock user";
const mock_password = "asdf"

exports.login_post = function(req, res, next) {
    let email = req.body.email;
    let password = req.body.password;
    // Incorrect format
    if (!email || !password || !email_regex.test(email) || !password_regex.test(password)){
        res.status(400)
        .send({
            success: 0,
            error_type: 1,
            error_msg:"Please enter valid email and password"
        });
    }

    //TODO: find user in db

    // user not found in db
    if (!user){
        res.status(400)
        .send({
            success: 0,
            error_type: 2,
            error_msg:"User not registed"
        });
    }

    // password incorrect
    if (bcrypt.hashSync(password) != mock_password){
        res.status(400)
        .send({
            success: 0,
            error_type: 3,
            error_msg:"Incorrect password"
        });
    }
    const token = jwt.sign({ sub: email }, "secret", { expiresIn: '1h' });
    res.json({
        success: 1,
        token: token
    });
};


exports.register_post = function(req, res, next) {
    let email = req.body.email;
    let password = req.body.password;
    let password2 = req.body.password;
    let error_types = [];
    let error_msg = [];
    // Incorrect format
    if (!email || !password || !password2){
        res.status(400)
        .send({
            success: 0,
            error_type: 1,
            error_msg:"Please enter valid email, password and confirmed password"
        });
    }

    // invalid email
    if(!email_regex.test(email)){
        res.status(400)
        .send({
            success: 0,
            error_type: 2,
            error_msg:"Invalid Email"
        });
    }

    // invalid password
    if(!password_regex.test(password)){
        res.status(400)
        .send({
            success: 0,
            error_type: 3,
            error_msg:"Invalid Password"
        });
    }

    // password not the same
    if(password != password2){
        res.status(400)
        .send({
            success: 0,
            error_type: 4,
            error_msg:"Confirmed password and password are different"
        });
    }

    //TODO: find user in db
    if (user === "user is found in db"){
        res.status(400)
        .send({
            success: 0,
            error_type: 5,
            error_msg:"User already registered"
        });
    }

    const hash_password = bcrypt.hashSync(password);
    //TODO: add user to db
    const token = jwt.sign({ sub: email }, "secret", { expiresIn: '1h' });
    res.json({
        success: 1,
        token: token
    });
};