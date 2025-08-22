const Sequelize = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define(
    'usage_charges_log',
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
      order_id: {
        type: Sequelize.STRING(20),
      },
      charge: {
        type: Sequelize.DOUBLE,
      },
      is_paid: {
        type: Sequelize.DataTypes.ENUM('0', '1', '2'),
        defaultValue: '0',
        allowNull: false,
        comment: '(0=no,1=yes,2=error)',
      },
      usage_charge_id: {
        type: Sequelize.STRING(20),
        defaultValue: null,
      },
      billing_on: {
        type: Sequelize.STRING,
        defaultValue: null,
      },
      balance_remaining: {
        type: Sequelize.STRING,
        defaultValue: null,
      },
      risk_level: {
        type: Sequelize.STRING,
        defaultValue: null,
      },
      description: {
        type: Sequelize.TEXT,
        defaultValue: null,
      },
      error: {
        type: Sequelize.TEXT,
        defaultValue: null,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: true,
      },
    },
    {
      collate: 'utf8mb4_unicode_ci',
      timestamps: false,
    }
  );
};
