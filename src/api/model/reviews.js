const dbConfig = {
    HOST: "localhost",
    USER: "root",
    PASSWORD: "Lengsicong0804",
    DB: "reviews",
    dialect: "mysql"
  };

const Sequelize = require("sequelize");

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
    host: dbConfig.HOST,
    dialect: dbConfig.dialect,
    operatorsAliases: false,
  });

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.tutorials = require("./reviews.model.js")(sequelize, Sequelize);

module.exports = db;
