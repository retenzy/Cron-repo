const Sequelize = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define(
    'amazon_reviews',
    {
      id: {
        type: Sequelize.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      store_id: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
        references: {
          model: 'stores',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      customer_email: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      customer_name: {
        type: Sequelize.STRING,
      },
      handle: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      product_id: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      review: {
        type: Sequelize.TEXT,
      },
      rating: {
        type: Sequelize.INTEGER(5),
      },
      review_images: {
        type: Sequelize.TEXT,
        defaultValue: '',
      },
      source: {
        type: Sequelize.STRING(50),
      },
      status: {
        type: Sequelize.ENUM('published', 'hidden'),
        allowNull: false,
      },
      reply: {
        type: Sequelize.STRING(500),
      },
      reply_source: {
        type: Sequelize.STRING,
      },
      reply_date: {
        type: Sequelize.DATE,
      },
      review_date: {
        type: Sequelize.DATE,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
    },
    {
      collate: 'utf8mb4_unicode_ci',
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: [
            'store_id',
            'customer_name',
            'customer_email',
            'handle',
            'review_date',
          ],
        },
        {
          index: true,
          fields: ['store_id', 'handle', 'product_id', 'status'],
        },
        {
          index: true,
          fields: ['status', 'store_id', 'review_date'],
        },
        {
          index: true,
          fields: ['rating', 'store_id', 'review_date'],
        },
        {
          index: true,
          fields: ['store_id', 'review_date', 'source'],
        },
        {
          index: true,
          fields: ['rating', 'store_id', 'review_date', 'status'],
        },
      ],
    }
  );
};
//-----------------------------------------------------
// const Sequelize = require("sequelize");

// module.exports = (sequelize) => {
//   return sequelize.define("test_amzn_reviews", {
//     id: {
//       type: Sequelize.INTEGER,
//       primaryKey: true,
//       autoIncrement: true,
//     },
//     title: {
//       type: Sequelize.STRING(45),
//     },
//     author: {
//       type: Sequelize.STRING(45),
//     },
//     rating: {
//       type: Sequelize.FLOAT,
//     },
//     text: {
//       type: Sequelize.STRING(45),
//     },
//     date: {
//       type: Sequelize.DATE,
//     },
//     verified_purchase: {
//       type: Sequelize.ENUM('0', '1'),
//     },
//     helpful: {
//       type: Sequelize.INTEGER,
//     },
//     product_id:{
//       type:Sequelize.INTEGER,
//     },
//     is_amzn_review:{
//       type: Sequelize.ENUM('0', '1'),
//     }

//   },
//   {
//     timestamps:false
//   }
//   );
// };
