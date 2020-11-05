module.exports = (sequelize, Sequelize) => {
    const Reviews = sequelize.define("reviews", {
      asin: {
        type: Sequelize.STRING
      },
      helpful: {
        type: Sequelize.INTEGER
      },
      reviewText: {
        type: Sequelize.STRING
      },
      reviewTime:{
          type: Sequelize.STRING
      },
      reviewerID:{
          type: Sequelize.STRING
      },
      reviewerName:{
          type: Sequelize.STRING
      },
      summary:{
          type: Sequelize.STRING
      },
      unixReviewTime:{
          type: Sequelize.BIGINT
      },
      rating:{
          type: Sequelize.INTEGER
      },
      reviewID:{
          type: Sequelize.INTEGER
      }
    });
  
    return Reviews;
  };