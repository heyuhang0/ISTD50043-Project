var express = require('express');
var router = express.Router();

var userController = require('../controllers/userController');

// login
router.post('/login', userController.login_post);

// register
router.post('/register', userController.register_post);

module.exports = router;