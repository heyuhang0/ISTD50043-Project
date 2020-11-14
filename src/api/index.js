require('dotenv').config()
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var mongooseMorgan = require('mongoose-morgan');
var mongoose = require('mongoose');

var mongoDB = process.env.MONGODB_URL;

var booksRouter = require('./routes/books');
var categoriesRouter = require('./routes/categories');
var userRouter = require('./routes/users');

// connect to mongo db
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// create app
var app = express();
var port = process.env.PORT || 8080;

// middlewares
app.use(mongooseMorgan({
  connectionString: process.env.MONGODB_URL
}, {}, 'short'
));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// routers
app.use('/api/books', booksRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/users', userRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: req.app.get('env') === 'development' ? err : {}
  });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});
