module.exports = (sequelize, Sequelize) => {
    const Review = sequelize.define("review", {
      reviewId:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      asin: {
        type: Sequelize.CHAR
      },
      reviewerId:{
        type: Sequelize.INTEGER
      },
      helpful: {
        type: Sequelize.INTEGER
      },
      rating:{
        type: Sequelize.INTEGER
      },
      summary:{
        type: Sequelize.TEXT
      },
      reviewText: {
        type: Sequelize.TEXT
      },
      updatedAt:{
          type: Sequelize.DATE
      },
      createdAt:{
          type: Sequelize.DATE
      },
    }, {
      freezeTableName: true,
    });

    return Review;
  };