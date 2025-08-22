const Sequelize = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'application_charge',
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      store_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'stores',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      charge_id: {
        type: Sequelize.STRING,
      },
      status: {
        type: Sequelize.STRING,
      },
      transaction_data: {
        type: Sequelize.TEXT,
      },
      priceplan_billing_on: {
        type: Sequelize.DATEONLY,
      },
      priceplan_activated_on: {
        type: Sequelize.DATEONLY,
      },
      plan_expiry_date: {
        type: Sequelize.DATEONLY,
      },
      is_private: {
        type: Sequelize.ENUM('0', '1'),
        defaultValue: '0',
      },
      billed_on: {
        type: Sequelize.DATEONLY,
      },
      is_annual: {
        type: Sequelize.ENUM('0', '1'),
        defaultValue: '0',
      },
      order_count: {
        type: Sequelize.INTEGER,
        defaultValue: '0',
      },
      order_count_from: {
        type: Sequelize.DATEONLY,
      },
    },
    {
      indexes: [
        {
          unique: true,
          fields: ['store_id', 'charge_id'],
        },
      ],
    }
  );
};
