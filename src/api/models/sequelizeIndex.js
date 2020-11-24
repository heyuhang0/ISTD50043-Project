const Sequelize = require("sequelize");

const sequelize = new Sequelize(process.env.MYSQL_URL);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.review = require("./reviews.js")(sequelize, Sequelize);
db.user = require("./user.js")(sequelize, Sequelize);

db.review.belongsTo(db.user, {foreignKey: 'reviewerId'})

module.exports = db;
