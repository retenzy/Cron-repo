const Sequelize = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define(
    'review',
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
      line_item_id: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      review: {
        type: Sequelize.STRING(700),
      },
      rating: {
        type: Sequelize.INTEGER(5),
        defaultValue: 1,
      },
      review_images: {
        type: Sequelize.TEXT,
        defaultValue: '',
      },
      source: {
        type: Sequelize.STRING(50),
      },
      source_tag: {
        type: Sequelize.STRING(75),
      },
      status: {
        type: Sequelize.ENUM('published', 'hidden'),
        allowNull: false,
      },
      is_verified: {
        type: Sequelize.ENUM('0', '1'),
        defaultValue: '0',
        allowNull: false,
      },
      is_reward_recieved: {
        type: Sequelize.ENUM('0', '1'),
        defaultValue: '0',
      },
      reply: {
        type: Sequelize.STRING(700),
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
      like: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      disLike: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
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
