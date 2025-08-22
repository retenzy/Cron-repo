const Sequelize = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'pricing_plans_discounts',
    {
      discount_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        unique: true,
      },
      discount_name: {
        type: Sequelize.STRING(45),
        allowNull: false,
      },
      discount_code: {
        type: Sequelize.STRING(45),
        allowNull: false,
      },
      discount_amount: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      discount_type: {
        type: Sequelize.ENUM('percentage', 'amount'),
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM('single', 'bulk', 'multiUser'),
        allowNull: false,
      },
      plan_type: {
        type: Sequelize.ENUM('monthly', 'annually', 'lifetime'),
        allowNull: false,
      },
      duration_limit_in_intervals: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      expires_on: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      },
      store_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      is_used: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: '0',
      },
      plans: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: true,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    },
    {
      collate: 'utf8mb4_unicode_ci',
      timestamps: false,
    }
  );
};
