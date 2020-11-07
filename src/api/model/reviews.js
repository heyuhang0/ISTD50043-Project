const Sequelize = require("sequelize");

const sequelize = new Sequelize(process.env.MYSQL_URL);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.review = require("./reviews.model.js")(sequelize, Sequelize);

module.exports = db;
