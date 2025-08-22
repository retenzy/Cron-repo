const Sequelize = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define(
    'credit_redemptions',
    {
      id: {
        type: Sequelize.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      store_id: {
        type: Sequelize.INTEGER(11),
        references: {
          model: 'stores',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      customer_id: {
        type: Sequelize.STRING(20),
        allowNull: false,
        references: {
          model: 'customers',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      customerId: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      credits: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      discount_value: {
        type: Sequelize.STRING,
      },
      discount_type: {
        type: Sequelize.STRING,
      },
      discount_condition: {
        type: Sequelize.JSON,
        defaultValue: null,
      },
      price_rule_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      discount_code: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      credits_left: {
        type: Sequelize.STRING,
        // allowNull: false,
      },
      is_redeemed: {
        type: Sequelize.ENUM('0', '1'),
        defaultValue: '0',
      },
      expires_on: {
        type: Sequelize.DATE,
      },
      is_expired: {
        type: Sequelize.ENUM('0', '1'),
        defaultValue: '0',
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: true,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    },
    {
      collate: 'utf8mb4_unicode_ci',
      timestamps: true,
    }
  );
};
