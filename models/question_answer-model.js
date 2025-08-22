const Sequelize = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define(
    'question_answer',
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
      question: {
        type: Sequelize.STRING(700),
      },
      answer: {
        type: Sequelize.STRING(700),
      },
      answer_date: {
        type: Sequelize.DATE,
      },
      status: {
        type: Sequelize.ENUM('published', 'hidden'),
        allowNull: false,
        defaultValue: 'hidden',
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
          index: true,
          fields: ['store_id', 'handle', 'product_id', 'status'],
        },
      ],
    }
  );
};
