module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define("user", {
    userId: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: Sequelize.CHAR
    },
    email: {
      type: Sequelize.CHAR
    },
    password: {
      type: Sequelize.CHAR
    },
    updatedAt: {
      type: Sequelize.DATE
    },
    createdAt: {
      type: Sequelize.DATE
    },
  },
    { freezeTableName: true }

  );

  return User;
};