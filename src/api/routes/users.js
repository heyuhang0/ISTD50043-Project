const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
let wrapper = fn => (...args) => fn(...args).catch(args[2]);

// login
router.post('/login', wrapper(userController.login_post));

// register
router.post('/register', wrapper(userController.register_post));

// get basic user information
router.get('/me', wrapper(userController.current_user_get));

module.exports = router;