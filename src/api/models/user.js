module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define("user", {
    userId: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    //   references: {
    //     model: 'review', // 'review' refers to table name
    //     key: 'reviewerId', // 'reviewerId' refers to column name in persons table
    //  }
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